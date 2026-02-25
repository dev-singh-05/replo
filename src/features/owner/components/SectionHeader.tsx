import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
    title: string;
    children?: React.ReactNode;
}

export function SectionHeader({ title, children }: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 28,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#e5e7eb',
    },
});
