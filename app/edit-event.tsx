import LostItemForm from '@/components/edit/Event'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

const editEvent = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LostItemForm />
    </GestureHandlerRootView>
  )
}

export default editEvent