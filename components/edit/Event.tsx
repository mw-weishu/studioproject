import { Text } from "@/theme/Themed";
import {
    handleDeleteLostItem,
    handleSaveLostItem,
    isAdminAdd$,
    selectedLostItemData$
} from "@/utilities/Events";
import { LostItemCategory } from "@/utilities/EventsStore";
import { observer, useSelector } from "@legendapp/state/react";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import {
    Button,
    Chip,
    Divider,
    IconButton,
    Menu,
    TextInput,
} from "react-native-paper";

const CATEGORIES: { value: LostItemCategory; label: string; icon: string }[] = [
  { value: "electronics", label: "Electronics", icon: "📱" },
  { value: "clothing", label: "Clothing", icon: "👕" },
  { value: "documents", label: "Documents", icon: "📄" },
  { value: "accessories", label: "Accessories", icon: "👜" },
  { value: "keys", label: "Keys", icon: "🔑" },
  { value: "bags", label: "Bags", icon: "🎒" },
  { value: "books", label: "Books", icon: "📚" },
  { value: "other", label: "Other", icon: "📦" },
];

const STATUSES = [
  { value: "lost", label: "Lost", color: "#e53935" },
  { value: "found", label: "Found", color: "#43a047" },
  { value: "claimed", label: "Claimed", color: "#757575" },
] as const;

const LostItemForm = observer(() => {
  const [saving, setSaving] = React.useState(false);
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const data = selectedLostItemData$.get();
  const isAdminMode = useSelector(() => isAdminAdd$.get());
  const isEdit = !!data.createdAt && !!data.id && data.title !== "" && !isAdminMode;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!data.title.trim()) {
      errors.title = 'Title is required.';
    }
    const dateStr = data.dateLostFound ? data.dateLostFound.slice(0, 10) : '';
    if (!dateStr) {
      errors.date = 'Date is required.';
    } else {
      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) {
        errors.date = 'Invalid date. Please use YYYY-MM-DD format.';
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      selectedLostItemData$.image.set(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await handleSaveLostItem();
      router.back();
    } catch (e: any) {
      alert(e?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!data.id) return;
    setSaving(true);
    try {
      await handleDeleteLostItem(data.id);
      router.back();
    } catch (e: any) {
      alert(e?.message || "Failed to delete.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
        <Text style={styles.screenTitle}>
          {isAdminMode ? "Add Found Item" : isEdit ? "Edit Item" : "Report Item"}
        </Text>
        {isEdit && !isAdminMode && (
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={24}
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              onPress={handleDelete}
              title="Delete"
              leadingIcon="delete"
            />
          </Menu>
        )}
      </View>

      <Divider style={styles.divider} />

      {/* Title */}
      <Text style={styles.label}>Title *</Text>
      <TextInput
        mode="outlined"
        placeholder="e.g. Blue Nike backpack"
        value={data.title}
        onChangeText={(t) => {
          selectedLostItemData$.title.set(t);
          if (fieldErrors.title) setFieldErrors((e) => ({ ...e, title: '' }));
        }}
        style={styles.input}
        maxLength={100}
        error={!!fieldErrors.title}
      />
      {fieldErrors.title ? <Text style={styles.errorText}>{fieldErrors.title}</Text> : null}

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        mode="outlined"
        placeholder="Describe the item in detail..."
        value={data.description}
        onChangeText={(t) => selectedLostItemData$.description.set(t)}
        multiline
        numberOfLines={4}
        style={[styles.input, styles.multilineInput]}
        maxLength={500}
      />

      {/* Category */}
      <Text style={styles.label}>Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat.value}
            selected={data.category === cat.value}
            onPress={() => selectedLostItemData$.category.set(cat.value)}
            style={styles.chip}
            compact
          >
            {cat.icon} {cat.label}
          </Chip>
        ))}
      </ScrollView>

      {/* Location */}
      <Text style={styles.label}>Location</Text>
      <TextInput
        mode="outlined"
        placeholder="e.g. Library 2nd floor, Science Building..."
        value={data.location}
        onChangeText={(t) => selectedLostItemData$.location.set(t)}
        style={styles.input}
        maxLength={200}
      />

      {/* Date lost/found */}
      <Text style={styles.label}>Date Lost / Found *</Text>
      <TextInput
        mode="outlined"
        placeholder="YYYY-MM-DD"
        value={data.dateLostFound ? data.dateLostFound.slice(0, 10) : ""}
        onChangeText={(t) => {
          const isoApprox = t.length === 10 ? new Date(t).toISOString() : t;
          selectedLostItemData$.dateLostFound.set(isoApprox);
          if (fieldErrors.date) setFieldErrors((e) => ({ ...e, date: '' }));
        }}
        style={styles.input}
        maxLength={10}
        keyboardType="numbers-and-punctuation"
        error={!!fieldErrors.date}
      />
      {fieldErrors.date ? <Text style={styles.errorText}>{fieldErrors.date}</Text> : null}

      {/* Contact info */}
      <Text style={styles.label}>Contact Info</Text>
      <TextInput
        mode="outlined"
        placeholder="Phone, email, or social handle..."
        value={data.contactInfo}
        onChangeText={(t) => selectedLostItemData$.contactInfo.set(t)}
        style={styles.input}
        maxLength={200}
      />

      {/* Photo — hidden for admin "add found item" mode */}
      {!isAdminMode && (
        <>
          <Text style={styles.label}>Photo</Text>
          <View style={styles.photoSection}>
            {data.image ? (
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: data.image }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                <IconButton
                  icon="close"
                  size={18}
                  style={styles.removeImage}
                  onPress={() => {
                    selectedLostItemData$.image.set(null);
                    selectedLostItemData$.imageUrl.set("");
                  }}
                />
              </View>
            ) : (
              <Button
                mode="outlined"
                icon="camera"
                onPress={handlePickImage}
                style={styles.photoButton}
              >
                Add Photo
              </Button>
            )}
          </View>
        </>
      )}

      <Divider style={styles.divider} />

      {/* Save button */}
      <Button
        mode="contained"
        onPress={handleSave}
        loading={saving}
        disabled={saving}
        style={styles.saveButton}
        contentStyle={styles.saveButtonContent}
        buttonColor="#fcba03"
        textColor="#000"
      >
        {isAdminMode ? "Add Found Item" : isEdit ? "Update Item" : "Submit Report"}
      </Button>
    </ScrollView>
  );
});

export default LostItemForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    paddingBottom: 60,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
  },
  screenTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  divider: {
    marginVertical: 12,
    backgroundColor: "#333",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#aaa",
    marginBottom: 6,
    marginTop: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#e53935',
    marginTop: 4,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#111",
    marginBottom: 4,
  },
  multilineInput: {
    minHeight: 100,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    marginBottom: 4,
  },
  photoSection: {
    marginBottom: 8,
  },
  photoButton: {
    borderColor: "#555",
  },
  imageWrapper: {
    position: "relative",
    width: 200,
    height: 200,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  removeImage: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  publicRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  saveButton: {
    marginTop: 20,
    borderRadius: 12,
  },
  saveButtonContent: {
    height: 50,
  },
});
