import { ColorPalette } from '@/constants/Colors'
import { defaultStyles } from '@/constants/Styles'
import { Link } from 'expo-router'
import React from 'react'
import { Button, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const BottomLoginSheet = () => {

  const { bottom }  = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingBottom: bottom }]}>
      {/* <TouchableOpacity style={[defaultStyles.btn, styles.btnLight]}>
        <Ionicons name="logo-apple" size={14} style={styles.btnIcon} />
        <Text style={styles.btnLightText}>Continue with Apple</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[defaultStyles.btn, styles.btnDark]}>
        <Ionicons name="logo-google" size={16} style={styles.btnIcon} color={'#fff'}/>
        <Text style={styles.btnDarkText}>Continue with Google</Text>
      </TouchableOpacity> */}
      <Link href={{
        pathname: '/auth',
        params: {
          type: 'register',
        }
      }} asChild style={[defaultStyles.btn, styles.btnDark]}>
        <Button title="Sign Up" color="transparent">
        </Button>
      </Link>
      <Link href={{
        pathname: '/auth',
        params: {
          type: 'login',
        }
      }} asChild style={[defaultStyles.btn, styles.btnDark]}>
        <Button title="Log In" color="transparent">
        </Button>
      </Link>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    width: '100%',
    padding: 26,
    gap: 14,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',

  },
  btnLight: {
    backgroundColor: '#fff',
  },
  btnIcon: {
    paddingRight: 7,
  },
  btnLightText: {
    fontSize: 20,
  },
  btnDark: {
    backgroundColor: ColorPalette.grey,
  },
  btnDarkText: {
    color: '#fff',
    fontSize: 20,
  },
  btnOutline: {
    borderWidth: 3,
    borderColor: ColorPalette.grey,
  }
})

export default BottomLoginSheet