import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { StaffMember } from '../types';
import { StatusBadge } from './StatusBadge';

interface Props {
    member: StaffMember;
    onPress: () => void;
}

export function MemberCard({ member, onPress }: Props) {
    const name = member.users?.full_name ?? 'Unknown';
    const phone = member.users?.phone ?? '';

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.avatar}>
                <Ionicons name="person" size={20} color="#6366f1" />
            </View>
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{name}</Text>
                <Text style={styles.sub} numberOfLines={1}>
                    {member.membership_number ? `#${member.membership_number}` : 'No ID'}
                    {phone ? ` · ${phone}` : ''}
                </Text>
            </View>
            <StatusBadge status={member.status} small />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111827',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 15,
        fontWeight: '600',
        color: '#e5e7eb',
    },
    sub: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
});
