import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { Button, Platform } from "react-native";

async function openPaymentModal({amount}: {amount: number}): Promise<void> {
    const siteUrl = 'https://routime.vercel.app'; // Replace with your deployed site URL
    const { url } = await fetch(`${siteUrl}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            custom_donation: amount.toString()
        },
    }).then(res => res.json());
    
    if (Platform.OS === 'web') {
        router.push(url);
    } else {
        // On mobile (iOS/Android), open the payment URL in a web browser
        await WebBrowser.openBrowserAsync(url);
    }
}


export default function CheckoutForm() {
    

    return (
    
    <Button title="Donate" onPress={() => openPaymentModal({amount: 10})} />
);
}