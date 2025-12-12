import { handleAdd, handleDelete, handleModify, selectedSavedEventData$ } from '@/utilities/Saved';
import { observer, Switch } from '@legendapp/state/react';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Button, Icon, IconButton, Menu, Switch as Toggle, TouchableRipple } from 'react-native-paper';
import { firebase } from '../../firebase.config';
import { Pressable, Text, TextInput } from '../../theme/Themed';
import { handleAddScheduleEvent, handleDeleteEvent, handleDeleteScheduleEvent, handleModifyEvent, handleModifyScheduleEvent, handleSaveEvent, selectedEventData$ } from '../../utilities/Events';
import { uploadEventImage } from '../../utilities/ImageUpload';
import { formatDate, openDate$, openTime$ } from '../../utilities/Pickers';
import { selectedScheduleData$ } from '../../utilities/Schedules';
import ToggleSwitch from '../ToggleSwitch';

const formatTime = (selectedTime: Date) => {
    if (!(selectedTime instanceof Date)) {
      selectedTime = new Date(selectedTime);
    }
    const formattedTime = selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return formattedTime;
  };

type Weekday = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

const Regular = observer(() => {

  const [visible, setVisible] = React.useState(false)

  const openMenu = () => {
    setVisible(true);
  }

  const closeMenu = () => {
    setVisible(false);
  }

  return (
    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
      <Text style={{textAlign: 'center', fontWeight: 'bold'}}>
        Repeat every
      </Text>
      <TextInput
        inputMode='numeric'
        keyboardType='numeric'
        style={{width: 40, height: 28, marginHorizontal: 10, textAlign: 'center', borderWidth: 1, borderRadius: 5, borderColor: 'grey'}}
        maxLength={4}
        value={selectedEventData$.repeatRule.regular.number.get()}
        // only numbers
        onChangeText={(text) => {
          const updatedtext = text.replace(/[^0-9]/g, '');
          if (updatedtext === '0') {
            selectedEventData$.repeatRule.regular.number.set('1');
            return;
          }
          selectedEventData$.repeatRule.regular.number.set(updatedtext);
        }}
      />
      <Menu
      visible={visible}
      onDismiss={closeMenu}
      anchor={
        <Pressable
        onPress={openMenu}
        style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}
        >
          <Text style={{fontWeight: 'bold'}}>
            {/* {selectedEventData$.repeatRule.regular.unit.get()} */}
            {selectedEventData$.repeatRule.regular.number.get() === '1' ? 'day' : 'days'}
          </Text>
          {/* <View style={{borderRadius: '100%', borderWidth: 1, borderColor: 'grey', marginLeft: 8}} >
          <Icon source='chevron-down' size={24}/>
          </View> */}
        </Pressable>
      }>
          <Menu.Item onPress={() => {selectedEventData$.repeatRule.regular.unit.set('days'); closeMenu()}} title="days" />
          {/* <Menu.Item onPress={() => {selectedEventData$.repeatRule.regular.unit.set('weeks'); closeMenu()}} title="weeks" /> */}
          {/* <Divider /> */}
          {/* <Menu.Item onPress={() => {selectedEventData$.repeatRule.regular.unit.set('months'); closeMenu()}} title="months" />
          <Menu.Item onPress={() => {selectedEventData$.repeatRule.regular.unit.set('years'); closeMenu()}} title="years" /> */}
      </Menu>
    </View>
  )
});


const Weekdays = observer(() => {
  const start = selectedEventData$.startDate.get();
  const end = selectedEventData$.endDate.get();

  const monday = selectedEventData$.repeatRule.weekdays.monday.active.get();
  const tuesday = selectedEventData$.repeatRule.weekdays.tuesday.active.get();
  const wednesday = selectedEventData$.repeatRule.weekdays.wednesday.active.get();
  const thursday = selectedEventData$.repeatRule.weekdays.thursday.active.get();
  const friday = selectedEventData$.repeatRule.weekdays.friday.active.get();
  const saturday = selectedEventData$.repeatRule.weekdays.saturday.active.get();
  const sunday = selectedEventData$.repeatRule.weekdays.sunday.active.get();


  const toggleDay = (day: Weekday) => () => {
    selectedEventData$.repeatRule.weekdays[day].active.toggle();
  }

  return (
    <View>
      <View style={{marginLeft: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Toggle
        value={selectedEventData$.repeatRule.weekdays.monday.active.get()}
        onValueChange={toggleDay('monday')}
        />
        <Text>Monday</Text>
        </View>
        {/* <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Pressable onPress={() => void 0} style={{padding: 3, borderWidth: 1, borderRadius: 8, marginVertical: 4,   borderColor: 'grey'}} >
        <Text>{start ? formatTime(selectedEventData$.startDate.get()) : '?'}</Text>
        </Pressable>
        <Text> - </Text>
        <Pressable onPress={() => void 0} style={{padding: 3, borderWidth: 1, borderRadius: 8, marginVertical: 4,   borderColor: 'grey'}} >
        <Text>{end ? formatTime(selectedEventData$.endDate.get()) : '?'}</Text>
        </Pressable>
        <Pressable onPress={() => void 0} style={{marginLeft: 6, opacity: monday ? 1 : 0}}>
        <Icon source='close' size={24}/>
        </Pressable>
        </View> */}
      </View>
      <View style={{marginLeft: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Toggle
        value={selectedEventData$.repeatRule.weekdays.tuesday.active.get()}
        onValueChange={toggleDay('tuesday')}
        />
        <Text>Tuesday</Text>
        </View>
        {/* <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Pressable onPress={() => void 0} style={{padding: 3, borderWidth: 1, borderRadius: 8, marginVertical: 4,   borderColor: 'grey'}} >
        <Text>{start ? formatTime(selectedEventData$.startDate.get()) : '?'}</Text>
        </Pressable>
        <Text> - </Text>
        <Pressable onPress={() => void 0} style={{padding: 3, borderWidth: 1, borderRadius: 8, marginVertical: 4,   borderColor: 'grey'}} >
        <Text>{end ? formatTime(selectedEventData$.endDate.get()) : '?'}</Text>
        </Pressable>
        <Pressable onPress={() => void 0} style={{marginLeft: 6}}>
        <Icon source='close' size={24}/>
        </Pressable>
        </View> */}
      </View>
      <View style={{marginLeft: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Toggle
        value={selectedEventData$.repeatRule.weekdays.wednesday.active.get()}
        onValueChange={toggleDay('wednesday')}
        />
        <Text>Wednesday</Text>
        </View>
        {/* <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Pressable onPress={() => void 0} style={{padding: 3, borderWidth: 1, borderRadius: 8, marginVertical: 4,   borderColor: 'grey'}} >
        <Text>{start ? formatTime(selectedEventData$.startDate.get()) : '?'}</Text>
        </Pressable>
        <Text> - </Text>
        <Pressable onPress={() => void 0} style={{padding: 3, borderWidth: 1, borderRadius: 8, marginVertical: 4,   borderColor: 'grey'}} >
        <Text>{end ? formatTime(selectedEventData$.endDate.get()) : '?'}</Text>
        </Pressable>
        <Pressable onPress={() => void 0} style={{marginLeft: 6}}>
        <Icon source='close' size={24}/>
        </Pressable>
        </View> */}
      </View>
      <View style={{marginLeft: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Toggle
        value={selectedEventData$.repeatRule.weekdays.thursday.active.get()}
        onValueChange={toggleDay('thursday')}
        />
        <Text>Thursday</Text>
        </View>
        {/* <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Pressable onPress={() => void 0} style={{padding: 3, borderWidth: 1, borderRadius: 8, marginVertical: 4,   borderColor: 'grey'}} >
        <Text>{start ? formatTime(selectedEventData$.startDate.get()) : '?'}</Text>
        </Pressable>
        <Text> - </Text>
        <Pressable onPress={() => void 0} style={{padding: 3, borderWidth: 1, borderRadius: 8, marginVertical: 4,   borderColor: 'grey'}} >
        <Text>{end ? formatTime(selectedEventData$.endDate.get()) : '?'}</Text>
        </Pressable>
        <Pressable onPress={() => void 0} style={{marginLeft: 6}}>
        <Icon source='close' size={24}/>
        </Pressable>
        </View> */}
      </View>
      <View style={{marginLeft: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Toggle
        value={selectedEventData$.repeatRule.weekdays.friday.active.get()}
        onValueChange={toggleDay('friday')}
        />
        <Text>Friday</Text>
        </View>
        {/* <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Pressable onPress={() => void 0} style={{padding: 3, borderWidth: 1, borderRadius: 8, marginVertical: 4,   borderColor: 'grey'}} >
        <Text>{start ? formatTime(selectedEventData$.startDate.get()) : '?'}</Text>
        </Pressable>
        <Text> - </Text>
        <Pressable onPress={() => void 0} style={{padding: 3, borderWidth: 1, borderRadius: 8, marginVertical: 4,   borderColor: 'grey'}} >
        <Text>{end ? formatTime(selectedEventData$.endDate.get()) : '?'}</Text>
        </Pressable>
        <Pressable onPress={() => void 0} style={{marginLeft: 6}}>
        <Icon source='close' size={24}/>
        </Pressable>
        </View> */}
      </View>
      <View style={{marginLeft: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Toggle
        value={selectedEventData$.repeatRule.weekdays.saturday.active.get()}
        onValueChange={toggleDay('saturday')}
        />
        <Text>Saturday</Text>
        </View>
        {/* <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Pressable onPress={() => void 0} style={{padding: 3, borderWidth: 1, borderRadius: 8, marginVertical: 4,   borderColor: 'grey'}} >
        <Text>{start ? formatTime(selectedEventData$.startDate.get()) : '?'}</Text>
        </Pressable>
        <Text> - </Text>
        <Pressable onPress={() => void 0} style={{padding: 3, borderWidth: 1, borderRadius: 8, marginVertical: 4,   borderColor: 'grey'}} >
        <Text>{end ? formatTime(selectedEventData$.endDate.get()) : '?'}</Text>
        </Pressable>
        <Pressable onPress={() => void 0} style={{marginLeft: 6}}>
        <Icon source='close' size={24}/>
        </Pressable>
        </View> */}
      </View>
      <View style={{marginLeft: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Toggle
        value={selectedEventData$.repeatRule.weekdays.sunday.active.get()}
        onValueChange={toggleDay('sunday')}
        />
        <Text>Sunday</Text>
        </View>
        {/* <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Pressable onPress={() => void 0} style={{padding: 3, borderWidth: 1, borderRadius: 8, marginVertical: 4,   borderColor: 'grey'}} >
        <Text>{start ? formatTime(selectedEventData$.startDate.get()) : '?'}</Text>
        </Pressable>
        <Text> - </Text>
        <Pressable onPress={() => void 0} style={{padding: 3, borderWidth: 1, borderRadius: 8, marginVertical: 4,   borderColor: 'grey'}} >
        <Text>{end ? formatTime(selectedEventData$.endDate.get()) : '?'}</Text>
        </Pressable>
        <Pressable onPress={() => void 0} style={{marginLeft: 6}}>
        <Icon source='close' size={24}/>
        </Pressable>
        </View> */}
      </View>
    </View>
  )
});


const Event = observer(() => {
    const [imageError, setImageError] = React.useState(false);
    const [localExists, setLocalExists] = React.useState(false);
    const [remoteExists, setRemoteExists] = React.useState(false);
    const [isChecking, setIsChecking] = React.useState(true);
    const [checking, setChecking] = React.useState(true);

    const imageUri = selectedEventData$.imageUrl.get();

    React.useEffect(() => {
        let cancelled = false;
        const checkImages = async () => {
          try {
            const localUri = selectedEventData$.image.get();
            const remoteUrl = selectedEventData$.imageUrl.get();
            if (localUri && localUri.startsWith('file://')) {
              try {
                const info = await FileSystem.getInfoAsync(localUri);
                if (!cancelled) setLocalExists(!!info.exists);
              } catch {
                if (!cancelled) setLocalExists(false);
              }
            }
            if (remoteUrl && !localExists) {
              try {
                await Image.prefetch(remoteUrl);
                if (!cancelled) setRemoteExists(true);
              } catch {
                if (!cancelled) setRemoteExists(false);
              }
            }
          } finally {
            if (!cancelled) setChecking(false);
          }
        };
        checkImages();
        return () => { cancelled = true; };
      }, [selectedEventData$.image.get(), selectedEventData$.imageUrl.get()]);

    const pickImage = async () => {
      // No permissions request is necessary for launching the image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      console.log(result);

      if (!result.canceled) {
        selectedEventData$.image.set(result.assets[0].uri);
        setImageError(false);
        setIsChecking(true);

        try {
          setChecking(true);
          const userId = firebase.auth().currentUser?.uid;
          const eventId = selectedEventData$.id.get();
          const imageUrl = await uploadEventImage(result.assets[0].uri, eventId || 'unknown', userId || 'unknown');
          selectedEventData$.imageUrl.set(imageUrl);
          setChecking(false);
        } catch (error) {
          console.log('Error uploading image:', error);
      }
    };
    };

    const lineHeight = 20;
    const eventType = selectedEventData$.eventType.get();
    const displayUri = localExists ? selectedEventData$.image.get() : remoteExists ? selectedEventData$.imageUrl.get() : null;
    const expectImage = !!(selectedEventData$.image.get() || selectedEventData$.imageUrl.get());
    
    return (
        <GestureHandlerRootView>
        <View style={{height: '100%', marginHorizontal: 20}}>
          {/* <Text> Event Type: {eventType}</Text> */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <View style={{flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', gap: 10, marginBottom: 10}}>
          <TouchableRipple onPress={() => router.back()} style={{backgroundColor: 'rgba(255, 255, 255, 0.3)', height: 30, width: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center'}}>
            <Icon source="chevron-left" size={30}/>
          </TouchableRipple>
          <View style={{flex: 1, height: 50}}>
          <TextInput
            placeholder='Event Name'
            placeholderTextColor={'gray'}
            value={selectedEventData$.title.get()}
            onChangeText={(text) => selectedEventData$.title.set(text)}
            style={{height: 50, fontWeight: 'bold', fontSize: 20, backgroundColor: 'rgba(100, 100, 100, 0.4)', borderRadius: 16, flex: 1, paddingHorizontal: 10}}
          />
          </View>
          {selectedEventData$.repeats.get() &&
          <ToggleSwitch
            isOn={selectedEventData$.on.get()}
            onToggle={() => selectedEventData$.on.toggle()}
            width={54}
            height={40}
            onBackgroundColor="goldenrod"
            offBackgroundColor="rgb(69, 69, 112)"
            circleColor="rgba(255, 255, 255, 0.8)"
            activeTextColor="#aaaaaa"
            inactiveTextColor="rgba(255, 255, 255, 0.5)"
            onText="ON"
            offText="OFF"
            />
          }
          </View>
          </View>
          <TextInput
            placeholder='Description'
            placeholderTextColor={'gray'}
            value={selectedEventData$.description.get()}
            onChangeText={(text) => selectedEventData$.description.set(text)}
            style={{
              height: 100,
              lineHeight,
              textAlignVertical: 'top',
              backgroundColor: 'rgba(69, 69, 120, 0.4)',
              borderRadius: 25,
              padding: 10,
              marginBottom: 10,
            }}
            multiline={true}
          />
          <Button
          onPress={() => {
            pickImage();
          }}
          >
            Add Media
          </Button>
          {expectImage && (
            displayUri && !checking && !imageError ? (
              <Image
                source={{ uri: displayUri }}
                style={styles.image}
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.imagePlaceholder} />
            )
          )}
          <View style={{justifyContent: 'space-around', backgroundColor: 'rgba(69, 69, 120, 0.4)', borderRadius: 25, paddingVertical: 20, paddingHorizontal: 50}}>
          {selectedEventData$.fullDay.get() ? null : (
          <View style={{flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10}}>
            <Button 
              style={styles.button} 
              onPress={() => {
                openTime$.case.set('start');
                console.log('start', selectedEventData$.startDate.get());
                openTime$.time.set(new Date(selectedEventData$.startDate.get()));
                console.log('openTime$', openTime$);
                openTime$.open.set(true);
              }}
            > 
              <Text style={{fontSize: 20, fontWeight: 'bold', textAlign: 'center'}}>{formatTime(selectedEventData$.startDate.get())}</Text>
            </Button>
            <Text style={{fontSize: 20, fontWeight: 'bold', textAlign: 'center'}}>-</Text>
            <Button 
              style={styles.button} 
              onPress={() => {
                openTime$.case.set('end'); 
                console.log('end', selectedEventData$.endDate.get());
                openTime$.time.set(new Date(selectedEventData$.endDate.get()));
                console.log('openTime$', openTime$);
                openTime$.open.set(true);
              }}
            >
              <Text style={{fontSize: 20, fontWeight: 'bold', textAlign: 'center'}}>{formatTime(selectedEventData$.endDate.get())}</Text>
            </Button>
          </View>
          )}
          {eventType === 'schedule' || eventType === 'saved' ? null : (
          <View style={{flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10}}>
            <Button 
              style={styles.button} 
              onPress={() => {
                openDate$.case.set('startend-oneday');
                openDate$.date.set(selectedEventData$.startDate.get());
                router.navigate('/date')
              }}
            > 
              <Text style={{fontSize: 20, fontWeight: 'bold', textAlign: 'center'}}>{formatDate(selectedEventData$.startDate.get())}</Text>
            </Button>
          </View>
          )}
          </View>
          
          <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 4}}>
            <Text>Notification</Text>
            <ToggleSwitch
              isOn={selectedEventData$.notification.get()}
              onToggle={() => selectedEventData$.notification.toggle()}
              width={36}
              height={28}
              onBackgroundColor="goldenrod"
              offBackgroundColor="rgb(69, 69, 112)"
              circleColor="rgba(255, 255, 255, 0.8)"
              activeTextColor="#aaaaaa"
              inactiveTextColor="rgba(255, 255, 255, 0.5)"
              onText=" "
              offText=" "
              />
            </View>
          </View>

          {(eventType === 'schedule' || eventType === 'saved') ? null : (
          <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 4}}>
            <Text>Repeats</Text>
            <ToggleSwitch
              isOn={selectedEventData$.repeats.get()}
              onToggle={() => selectedEventData$.repeats.toggle()}
              width={36}
              height={28}
              onBackgroundColor="goldenrod"
              offBackgroundColor="rgb(69, 69, 112)"
              circleColor="rgba(255, 255, 255, 0.8)"
              activeTextColor="#aaaaaa"
              inactiveTextColor="rgba(255, 255, 255, 0.5)"
              onText=" "
              offText=" "
              />
            </View>
          </View>
          )}
          {selectedEventData$.repeats.get() ? (
          <View style={{justifyContent: 'space-around', backgroundColor: 'rgba(69, 69, 120, 0.4)', borderRadius: 25, paddingVertical: 20, paddingHorizontal: 30}}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <View>
              <Text style={{fontSize: 20, fontWeight: 'bold', textAlign: 'center'}}>
                {selectedEventData$.repeatRule.rule.get() === 'regular' ? 'Regular' : 'Weekdays'}
              </Text>
            </View>
            <View style={{flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start'}}>
            <IconButton icon='calendar-refresh' size={20} onPress={() => selectedEventData$.repeatRule.rule.set('regular')} style={{height: 20, width: 20}} iconColor={selectedEventData$.repeatRule.rule.get() === 'regular' ? 'goldenrod' : 'gray'}/>
            <IconButton icon='view-week' size={20} onPress={() => selectedEventData$.repeatRule.rule.set('weekdays')} style={{height: 20, width: 20}} iconColor={selectedEventData$.repeatRule.rule.get() === 'weekdays' ? 'goldenrod' : 'gray'}/>
            </View>
          </View>
          <Switch value={selectedEventData$.repeatRule.rule.get()}>
            {{
              regular: () => <Regular/>,
              weekdays: () => <Weekdays/>,
            }}
          </Switch>
          </View>
          ) : null}
        <View style={{width: '100%', flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, marginBottom: 20}}>
            <Button icon='check' style={styles.button} onPress={() => {
            if (selectedEventData$.title.get() !== ''){
              if (eventType === 'pager') {
                if (selectedEventData$.id.get()) {
                  handleModifyEvent(selectedEventData$.get());
                } else {
                  handleSaveEvent();
                }
              }
              else if (eventType === 'saved') {
                const newEvent = {
                  ...selectedEventData$.get(),
                  startDate: selectedEventData$.startDate.get(),
                  endDate: selectedEventData$.endDate.get(),
                  applydate: new Date(),
                  eventType: 'saved',
                }
                selectedSavedEventData$.set(newEvent);
                if (selectedEventData$.id.get()) {
                  handleModify();
                }
                else {
                  handleAdd();
                }
              }
              else if (eventType === 'schedule') {
                if (selectedEventData$.id.get()) {
                  handleModifyScheduleEvent(selectedScheduleData$.dayIndex.get());
                }
                else {
                  handleAddScheduleEvent(selectedScheduleData$.dayIndex.get());
                }
              }
                router.back();
            }
            else {
              alert('Event Name required.')
            }
            }}>
              <Text style={{fontSize: 14, fontWeight: 'bold', textAlign: 'center'}}>Save</Text>
            </Button>
            {selectedEventData$.id.get() &&
            <Button icon='trash-can' style={styles.button} onPress={() => {
              if (eventType === 'pager') {
                handleDeleteEvent(selectedEventData$.get() as any);
              }
              else if (eventType === 'saved') {
                const newEvent = {
                  ...selectedEventData$.get(),
                  applydate: new Date(),
                  eventType: 'saved',
                }
                selectedSavedEventData$.set(newEvent);
                handleDelete();
              }
              else if (eventType === 'schedule') {
                handleDeleteScheduleEvent(selectedScheduleData$.dayIndex.get());
              }
              router.back();
            }}>
              <Text style={{fontSize: 14, fontWeight: 'bold', textAlign: 'center'}}>Delete</Text>
            </Button>
            }
          </View>
        </View>
        
        </GestureHandlerRootView>
      );
});

export default Event

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(69, 69, 120, 0.8)',
    borderRadius: 10,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    marginBottom: 10,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)'
  },
})