import React from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

interface Props extends TextInputProps {
    label: string;
    error?: string | null;
    hint?: string;
}

export function FormInput({ label, error, hint, style, ...rest }: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[styles.input, error ? styles.inputError : null, style]}
                placeholderTextColor="#6b7280"
                {...rest}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#d1d5db',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#1f2937',
        borderWidth: 1,
        borderColor: '#374151',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#f9fafb',
    },
    inputError: {
        borderColor: '#ef4444',
    },
    error: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 4,
    },
    hint: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
});
