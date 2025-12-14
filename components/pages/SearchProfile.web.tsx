import { firebase } from '@/firebase.config'
import { Text, View } from '@/theme/Themed'
import { loadProfileByHandle, setSelectedUserProfile } from '@/utilities/UserProfile'
import { observer } from '@legendapp/state/react'
import { router } from 'expo-router'
import React from 'react'
import { Image, StyleSheet, TouchableOpacity } from 'react-native'
import { GestureHandlerRootView, ScrollView, TextInput } from 'react-native-gesture-handler'

interface SearchResult {
  handle: string;
  avatar: string;
}

const MyProfile = observer(() => {

  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const searchHandles = async (query: string) => {
  try {
    setError(null);
    setResults([]);
    const trimmed = (query || '').trim().toLowerCase();
    if (trimmed.length < 2) {
      return; // avoid super broad scans
    }
    setLoading(true);
    const snap = await firebase
      .database()
      .ref('/handles')
      .orderByKey()
      .startAt(trimmed)
      .endAt(trimmed + "\uf8ff")
      .limitToFirst(25)
      .once('value');
    if (snap.exists()) {
      const val = snap.val() as Record<string, string>;
      const handles = Object.keys(val || {});
      
      // Fetch avatar for each handle
      const resultsWithAvatars = await Promise.all(
        handles.map(async (handle) => {
          try {
            const userId = val[handle];
            const profileSnap = await firebase
              .database()
              .ref(`/profiles/${userId}`)
              .once('value');
            const profile = profileSnap.val();
            return {
              handle,
              avatar: profile?.avatar || ''
            };
          } catch (e) {
            return {
              handle,
              avatar: ''
            };
          }
        })
      );
      
      setResults(resultsWithAvatars);
    } else {
      setResults([]);
    }
  } catch (e: any) {
    setError(e?.message || 'Search failed');
  } finally {
    setLoading(false);
  }
};

  const viewProfile = async (handle: string) => {
    try {
      console.log('Viewing profile for handle:', handle);
      const profile = await loadProfileByHandle(handle);
      console.log('Loaded profile:', profile);
      if (profile) {
        setSelectedUserProfile(profile);
        router.push(`/${handle}`);
      }
    } catch (e) {
      // swallow for now or set error
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, marginHorizontal: 200 }}>
    <View style={{padding: 16}}>
        <TextInput placeholder="Search accounts"
        placeholderTextColor={'gray'} 
        style={{height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, padding: 10, color: 'white',}}
        onChangeText={(text) => {
          setQuery(text);
          searchHandles(text);
        }}
        value={query}
        />
        {/* <Button mode="contained" onPress={() => searchHandles(query$.get())} disabled={loading$.get()}>
            {loading$.get() ? 'Searching…' : 'Search'}
        </Button> */}
        {error && <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text>}
        <ScrollView style={{ marginTop: 12, maxHeight: 300 }}>
          {results.length === 0 && query.trim().length >= 2 && !loading ? (
            <Text>No accounts found</Text>
          ) : (
            results.map((result) => (
              <TouchableOpacity key={result.handle} style={styles.resultItem} onPress={() => viewProfile(result.handle)}>
                {result.avatar ? (
                  <Image source={{ uri: result.avatar }} style={styles.avatar} />
                ) : (
                  <Image source={require('@/assets/images/icon.png')} style={styles.avatar} />
                )}
                <Text style={styles.handleText}>{result.handle}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
    </View>
    </GestureHandlerRootView>
  )
})

export default MyProfile

const styles = StyleSheet.create({
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'gray',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  handleText: {
    flex: 1,
  },
})