import { Text } from '@/theme/Themed';
import { LostItemCategory } from '@/utilities/EventsStore';
import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Icon } from 'react-native-paper';

export const ALL_CATEGORIES: { label: string; value: LostItemCategory; icon: string }[] = [
  { label: 'Electronics', value: 'electronics', icon: '📱' },
  { label: 'Clothing',    value: 'clothing',    icon: '👕' },
  { label: 'Documents',   value: 'documents',   icon: '📄' },
  { label: 'Accessories', value: 'accessories', icon: '👜' },
  { label: 'Keys',        value: 'keys',        icon: '🔑' },
  { label: 'Bags',        value: 'bags',        icon: '🎒' },
  { label: 'Books',       value: 'books',       icon: '📚' },
  { label: 'Other',       value: 'other',       icon: '📦' },
];

interface SearchFilterBarProps {
  query: string;
  onQueryChange: (text: string) => void;
  selectedCategories: LostItemCategory[];
  onToggleCategory: (cat: LostItemCategory) => void;
}

const SearchFilterBar = ({
  query,
  onQueryChange,
  selectedCategories,
  onToggleCategory,
}: SearchFilterBarProps) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const filterCount = selectedCategories.length;

  return (
    <View style={styles.row}>
      {/* Text search */}
      <View style={styles.inputWrap}>
        <Icon source="magnify" size={18} color="#888" />
        <TextInput
          style={styles.input}
          placeholder="Search title or description…"
          placeholderTextColor="#555"
          value={query}
          onChangeText={onQueryChange}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => onQueryChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon source="close-circle" size={16} color="#555" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category dropdown trigger */}
      <TouchableOpacity
        style={[styles.filterBtn, filterCount > 0 && styles.filterBtnActive]}
        onPress={() => setMenuOpen(true)}
        activeOpacity={0.7}
      >
        <Icon source="tag-multiple-outline" size={16} color={filterCount > 0 ? '#000' : '#ccc'} />
        {filterCount > 0 && (
          <Text style={styles.filterBadge}>{filterCount}</Text>
        )}
      </TouchableOpacity>

      {/* Category checkbox modal */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.dropdown} onPress={(e) => e.stopPropagation()}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Filter by Category</Text>
              {filterCount > 0 && (
                <TouchableOpacity onPress={() => ALL_CATEGORIES.forEach(c => selectedCategories.includes(c.value) && onToggleCategory(c.value))}>
                  <Text style={styles.clearAll}>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>
            {ALL_CATEGORIES.map((cat) => {
              const checked = selectedCategories.includes(cat.value);
              return (
                <TouchableOpacity
                  key={cat.value}
                  style={styles.option}
                  onPress={() => onToggleCategory(cat.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionIcon}>{cat.icon}</Text>
                  <Text style={styles.optionLabel}>{cat.label}</Text>
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default SearchFilterBar;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 6,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 0,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  filterBtnActive: {
    backgroundColor: '#fcba03',
  },
  filterBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  // modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 120,
    paddingRight: 12,
  },
  dropdown: {
    backgroundColor: '#1c1c1e',
    borderRadius: 14,
    paddingVertical: 8,
    width: 240,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
    marginBottom: 4,
  },
  dropdownTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearAll: {
    fontSize: 13,
    color: '#fcba03',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 10,
  },
  optionIcon: {
    fontSize: 16,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#fcba03',
    borderColor: '#fcba03',
  },
  checkmark: {
    fontSize: 12,
    color: '#000',
    fontWeight: '800',
    lineHeight: 14,
  },
});
