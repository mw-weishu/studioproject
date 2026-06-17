import { Text, View } from '@/theme/Themed';
import { onDateConfirm } from "@/utilities/Pickers";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, TextInput } from "react-native";
import { Button } from "react-native-paper";

export default function MyCalendar() {
  const today = new Date();
  const [day, setDay] = useState(String(today.getDate()));
  const [month, setMonth] = useState(String(today.getMonth() + 1));
  const [year, setYear] = useState(String(today.getFullYear()));

  const selectedDate = (() => {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (!d || !m || !y || m < 1 || m > 12 || d < 1 || d > 31) return null;
    const date = new Date(y, m - 1, d);
    return isNaN(date.getTime()) ? null : date;
  })();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Date</Text>

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>Day</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            maxLength={2}
            value={day}
            onChangeText={setDay}
            placeholder="DD"
            placeholderTextColor="#888"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Month</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            maxLength={2}
            value={month}
            onChangeText={setMonth}
            placeholder="MM"
            placeholderTextColor="#888"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Year</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            maxLength={4}
            value={year}
            onChangeText={setYear}
            placeholder="YYYY"
            placeholderTextColor="#888"
          />
        </View>
      </View>

      <View style={styles.buttons}>
        <Button mode="contained" onPress={() => router.back()} style={styles.cancel}>
          Cancel
        </Button>
        <Button
          mode="contained"
          disabled={!selectedDate}
          onPress={() => {
            if (selectedDate) {
              onDateConfirm(selectedDate);
              router.back();
            }
          }}
          style={{ backgroundColor: selectedDate ? 'goldenrod' : '#333' }}
        >
          <Text style={{ color: selectedDate ? 'white' : '#888' }}>Confirm</Text>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  field: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    backgroundColor: '#1e1e1e',
    color: 'white',
    borderRadius: 10,
    padding: 12,
    fontSize: 20,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancel: {
    backgroundColor: '#333',
  },
});