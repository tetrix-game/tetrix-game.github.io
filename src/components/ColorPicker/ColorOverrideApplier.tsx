import { useEffect } from 'react';
import { useColorPicker } from './useColorPicker';
import { ColorName } from '../../types';

const ColorOverrideApplier: React.FC = () => {
  const { colorOverrides } = useColorPicker();

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply color overrides via CSS custom properties
    const colorNames: ColorName[] = ['grey', 'red', 'orange', 'yellow', 'green', 'blue', 'purple'];
    
    colorNames.forEach(colorName => {
      const overrides = colorOverrides[colorName];
      
      if (overrides?.background) {
        root.style.setProperty(`--color-${colorName}-bg`, overrides.background);
      } else {
        root.style.removeProperty(`--color-${colorName}-bg`);
      }
      
      if (overrides?.borderTop) {
        root.style.setProperty(`--color-${colorName}-border-top`, overrides.borderTop);
      } else {
        root.style.removeProperty(`--color-${colorName}-border-top`);
      }
      
      if (overrides?.borderLeft) {
        root.style.setProperty(`--color-${colorName}-border-left`, overrides.borderLeft);
      } else {
        root.style.removeProperty(`--color-${colorName}-border-left`);
      }
      
      if (overrides?.borderBottom) {
        root.style.setProperty(`--color-${colorName}-border-bottom`, overrides.borderBottom);
      } else {
        root.style.removeProperty(`--color-${colorName}-border-bottom`);
      }
      
      if (overrides?.borderRight) {
        root.style.setProperty(`--color-${colorName}-border-right`, overrides.borderRight);
      } else {
        root.style.removeProperty(`--color-${colorName}-border-right`);
      }
    });
  }, [colorOverrides]);

  return null;
};

export default ColorOverrideApplier;
