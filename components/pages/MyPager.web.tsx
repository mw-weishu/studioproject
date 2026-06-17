import LostItemCard from "@/components/items/LostItemCard";
import SearchFilterBar from "@/components/items/SearchFilterBar";
import { Text } from "@/theme/Themed";
import { isAdmin$ } from "@/utilities/AdminUtils";
import { setDefaultFoundItemData } from "@/utilities/Events";
import { LostItem, LostItemCategory, foundItems$ } from "@/utilities/EventsStore";
import { useSelector } from "@legendapp/state/react";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Chip } from "react-native-paper";

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Found", value: "found" },
  { label: "Claimed", value: "claimed" },
] as const;

type FilterValue = (typeof STATUS_FILTERS)[number]["value"];

const LostItemFeed = () => {
  const [filter, setFilter] = React.useState<FilterValue>("all");
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategories, setSelectedCategories] = React.useState<LostItemCategory[]>([]);
  const isAdmin = useSelector(() => isAdmin$.get());

  const toggleCategory = (cat: LostItemCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const sorted = useSelector(() => {
    const all = Object.values(foundItems$.get() || {}) as LostItem[];
    const visible = all.filter(
      (item) =>
        !!item &&
        (filter === "all" || item.status === filter)
    );
    return [...visible].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  const displayed = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sorted.filter((item) => {
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q);
      const matchesCat =
        selectedCategories.length === 0 || selectedCategories.includes(item.category);
      return matchesQuery && matchesCat;
    });
  }, [sorted, searchQuery, selectedCategories]);

  return (
    <View style={styles.container}>
      {/* Header row with title + add button */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>Findora</Text>
          <Text style={styles.subtitle}>
            University Lost & Found
          </Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setDefaultFoundItemData();
              router.navigate("/edit-event");
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>Add Found Item</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f.value}
            selected={filter === f.value}
            onPress={() => setFilter(f.value)}
            style={styles.filterChip}
            textStyle={styles.filterChipText}
            compact
          >
            {f.label}
          </Chip>
        ))}
      </ScrollView>

      {/* Search + category filter */}
      <SearchFilterBar
        query={searchQuery}
        onQueryChange={setSearchQuery}
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategory}
      />

      {/* Items list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {displayed.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No items yet.</Text>
            <Text style={styles.emptyHint}>
              Tap + to report a lost or found item.
            </Text>
          </View>
        ) : (
          displayed.map((item) => (
            <LostItemCard key={item.id} item={item} showActions={false} isAdminView={isAdmin} allowClaim={!isAdmin} />
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default LostItemFeed;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 4,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fcba03",
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
  },
  addButton: {
    backgroundColor: "#fcba03",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000",
  },
  filterRow: {
    flexGrow: 0,
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: "row",
  },
  filterChip: {
    marginRight: 4,
  },
  filterChipText: {
    fontSize: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ccc",
  },
  emptyHint: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
