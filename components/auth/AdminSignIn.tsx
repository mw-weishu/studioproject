import { firebase } from '@/firebase.config';
import { Text, View } from '@/theme/Themed';
import { checkAndSetAdmin } from '@/utilities/AdminUtils';
import { persistEvents } from '@/utilities/EventsStore';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, TextInput } from 'react-native-paper';

const AdminSignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
      if (cred.user) {
        const admin = await checkAndSetAdmin(cred.user.uid);
        if (!admin) {
          await firebase.auth().signOut();
          alert('This account does not have admin access.');
          setLoading(false);
          return;
        }
        persistEvents(cred.user.uid);
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      alert(err?.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterPress = (e: any) => {
    if (e.key === 'Enter') handleSignIn();
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Admin Sign In</Text>
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
          icon="shield-account"
          onPress={handleSignIn}
          disabled={loading}
          style={styles.button}
        >
          {loading ? '...' : 'Sign In as Admin'}
        </Button>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
        <Text style={styles.text}>New admin? </Text>
        <Button
          mode="outlined"
          icon="account-plus-outline"
          style={styles.smallButton}
          onPress={() => router.push({ pathname: '/admin-auth', params: { type: 'register' } })}
        >
          Register
        </Button>
      </View>
    </View>
  );
};

export default AdminSignIn;

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20, color: '#fcba03' },
  input: { height: 50, width: 300, marginBottom: 8 },
  button: { minWidth: 220 },
  smallButton: { minWidth: 130, margin: 4 },
  text: { fontSize: 16, marginHorizontal: 10 },
});
