import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PlayScreen from "@/screens/PlayScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type PlayStackParamList = {
  Play: undefined;
};

const Stack = createNativeStackNavigator<PlayStackParamList>();

export default function PlayStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Play"
        component={PlayScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Squad Party" />,
        }}
      />
    </Stack.Navigator>
  );
}
