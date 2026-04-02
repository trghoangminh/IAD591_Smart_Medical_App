import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { theme } from '../styles/theme';

export const Button = ({ 
  children, 
  variant = 'primary', // primary, secondary, danger
  style, 
  onPress, 
  icon 
}) => {
  
  const getVariantStyles = () => {
    switch(variant) {
      case 'secondary':
        return [styles.btnSecondary, styles.btnSecondaryText];
      case 'danger':
        return [styles.btnDanger, styles.btnDangerText];
      case 'primary':
      default:
        return [styles.btnPrimary, styles.btnPrimaryText];
    }
  };

  const [bgStyle, textStyle] = getVariantStyles();

  return (
    <TouchableOpacity 
      style={[styles.btn, bgStyle, style]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon && <View style={styles.iconStyle}>{icon}</View>}
      {typeof children === 'string' ? (
        <Text style={[styles.btnText, textStyle]}>{children}</Text>
      ) : children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: theme.radius.full,
    width: '100%',
  },
  btnText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  iconStyle: {
    marginRight: 8,
  },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  btnPrimaryText: {
    color: '#FFF',
  },
  btnSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnSecondaryText: {
    color: theme.colors.primary,
  },
  btnDanger: {
    backgroundColor: theme.colors.danger,
  },
  btnDangerText: {
    color: '#FFF',
  }
});
