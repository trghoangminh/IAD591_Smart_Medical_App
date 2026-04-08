# Smart Medical AI

Backend AI module for medication adherence prediction, analytics, and doctor-facing chart data.

## Quick Start

```bash
cd ai
pip install -e '.[dev]'
PYTHONPATH=src uvicorn smart_medical_ai.main:app --reload
```

## Train the Model

```bash
cd ai
PYTHONPATH=src python -m smart_medical_ai.ml.train
```

If no Kaggle dataset is present in `data/raw/`, the trainer generates a bootstrap model from synthetic data so the API remains runnable.
