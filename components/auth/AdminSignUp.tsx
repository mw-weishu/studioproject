import { clearAllData } from '@/components/pages/MyAccount';
import { firebase } from '@/firebase.config';
import { Text, View } from '@/theme/Themed';
import { checkAndSetAdmin, claimAdminHandle } from '@/utilities/AdminUtils';
import { lastUserHandle$, lastUserId$, persistEvents } from '@/utilities/EventsStore';
import {
    checkHandleAvailability,
    claimHandle,
    getHandleForUser,
    persistUserProfile,
} from '@/utilities/UserProfile';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, TextInput } from 'react-native-paper';

const AdminSignUp = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (loading) return;
    if (!username) {
      alert('Please enter a username');
      return;
    }
    setLoading(true);
    try {
      const { available, error } = await checkHandleAvailability(username);
      if (!available) {
        alert(error || 'Username not available');
        setLoading(false);
        return;
      }
      const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const uid = cred.user?.uid || '';
      // Claim regular handle + admin handle
      await claimHandle(uid, username);
      await claimAdminHandle(uid, username);
      await persistUserProfile(username.toLowerCase());
      await checkAndSetAdmin(uid);
      alert('Admin account created');
      if (cred.user) {
        lastUserId$.set(uid);
        lastUserHandle$.set(getHandleForUser(uid).toString());
        persistEvents(uid);
        await clearAllData();
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      alert(err?.message || 'Error creating admin account');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterPress = (e: any) => {
    if (e.key === 'Enter') handleSignUp();
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Create Admin Account</Text>
      <TextInput
        label="Username"
        mode="outlined"
        value={username}
        onChangeText={setUsername}
        onKeyPress={handleEnterPress}
        style={styles.input}
      />
      <TextInput
        label="Email"
        mode="outlined"
        value={email}
        onChangeText={setEmail}
        onKeyPress={handleEnterPress}
        style={styles.input}
      />
      <TextInput
        label="Password"
        mode="outlined"
        value={password}
        onChangeText={setPassword}
        onKeyPress={handleEnterPress}
        secureTextEntry
        style={styles.input}
      />
      <View style={{ marginTop: 12 }}>
        <Button
          mode="outlined"
          icon="shield-account-outline"
          onPress={handleSignUp}
          disabled={loading}
          style={styles.button}
        >
          {loading ? '...' : 'Create Admin Account'}
        </Button>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
        <Text style={styles.text}>Already an admin? </Text>
        <Button
          mode="outlined"
          icon="account-outline"
          style={styles.smallButton}
          onPress={() => router.push({ pathname: '/admin-auth', params: { type: 'login' } })}
        >
          Sign In
        </Button>
      </View>
    </View>
  );
};

export default AdminSignUp;

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20, color: '#fcba03' },
  input: { height: 50, width: 300, marginBottom: 8 },
  button: { minWidth: 260 },
  smallButton: { minWidth: 130, margin: 4 },
  text: { fontSize: 16, marginHorizontal: 10 },
});
