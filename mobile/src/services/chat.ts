import { analyticsApiBaseUrl } from './analytics';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface StreamChatOptions {
  userId: number;
  message: string;
  history: ChatMessage[];
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
  signal?: AbortSignal;
}

/**
 * Gọi POST /api/chat/stream và parse SSE qua XHR.
 * Hoạt động trên iOS, Android và Expo web.
 */
export function streamChat(opts: StreamChatOptions): void {
  const { userId, message, history, onToken, onDone, onError, signal } = opts;

  let aborted = false;
  let doneFired = false;
  let buffer = '';

  const fireOnce = (fn: () => void) => {
    if (doneFired) return;
    doneFired = true;
    fn();
  };

  const xhr = new XMLHttpRequest();

  // Flush any buffered SSE text
  const flushBuffer = () => {
    // SSE events are delimited by "\n\n"
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? ''; // last piece may be incomplete
    for (const event of events) {
      for (const line of event.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const raw = trimmed.slice(5).trim();
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          if (typeof parsed.token === 'string') {
            onToken(parsed.token);
          } else if (parsed.done === true) {
            fireOnce(onDone);
          } else if (typeof parsed.error === 'string') {
            fireOnce(() => onError(mapErrorCode(parsed.code as string | undefined, parsed.error as string)));
          }
        } catch {
          // incomplete / non-JSON line — skip
        }
      }
    }
  };

  xhr.open('POST', `${analyticsApiBaseUrl}/api/chat/stream`, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Accept', 'text/event-stream');

  let cursor = 0;
  xhr.onprogress = () => {
    const chunk = xhr.responseText.slice(cursor);
    cursor = xhr.responseText.length;
    buffer += chunk;
    flushBuffer();
  };

  xhr.onload = () => {
    if (aborted) return;
    // Flush any trailing data
    buffer += xhr.responseText.slice(cursor);
    flushBuffer();

    if (xhr.status === 403) {
      fireOnce(() => onError('Tính năng này chỉ dành cho bệnh nhân.'));
    } else if (xhr.status === 404) {
      fireOnce(() => onError('Không tìm thấy tài khoản người dùng.'));
    } else if (xhr.status === 503) {
      fireOnce(() => onError('Không kết nối được cơ sở dữ liệu. Vui lòng thử lại.'));
    } else if (xhr.status >= 400) {
      fireOnce(() => onError(`Lỗi máy chủ (${xhr.status}). Vui lòng thử lại.`));
    } else {
      // Stream ended cleanly without explicit {done: true}
      fireOnce(onDone);
    }
  };

  xhr.onerror = () => {
    if (aborted) return;
    fireOnce(() => onError('Không kết nối được máy chủ AI. Kiểm tra kết nối mạng.'));
  };

  if (signal) {
    const abortHandler = () => {
      aborted = true;
      xhr.abort();
      signal.removeEventListener('abort', abortHandler);
    };
    signal.addEventListener('abort', abortHandler);
  }

  xhr.send(
    JSON.stringify({
      user_id: userId,
      message,
      history: history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    })
  );
}

function mapErrorCode(code: string | undefined, fallback: string): string {
  switch (code) {
    case 'config_error':
      return 'Dịch vụ AI chưa được cấu hình. Vui lòng liên hệ quản trị viên.';
    case 'forbidden':
      return 'Tính năng này chỉ dành cho bệnh nhân.';
    case 'server_error':
    default:
      return fallback || 'Đã xảy ra lỗi, vui lòng thử lại.';
  }
}
