import AdminSignIn from '@/components/auth/AdminSignIn';
import AdminSignUp from '@/components/auth/AdminSignUp';
import { useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

const AdminAuthPage = () => {
  const { type } = useLocalSearchParams<{ type: string }>();
  const authType = type || 'login';

  return (
    <View style={styles.wrapper}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={1}
      >
        <View style={styles.auth}>
          {authType === 'register' ? <AdminSignUp /> : <AdminSignIn />}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default AdminAuthPage;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  auth: {
    gap: 10,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    width: '100%',
    maxWidth: 380,
  },
});
