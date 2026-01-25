import { StyleSheet } from 'react-native';
import theme from '../../../utils/colors';

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: theme.colors.background,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    headerAction: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EEEEEE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerActionText: {
        fontSize: 24,
        color: theme.colors.primary,
        lineHeight: 28,
    },
    listContent: {
        paddingBottom: 20,
    },
    chatItem: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: theme.colors.card, // Or background if we want flat look
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 15,
    },
    avatar: {
        width: 55,
        height: 55,
        borderRadius: 28, // Slightly more than half for perfect circle
        backgroundColor: '#E0E0E0',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: theme.colors.card,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    rowTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 17,
        fontWeight: '600',
        color: theme.colors.text,
        flex: 1,
    },
    time: {
        fontSize: 12,
        color: '#888',
        marginLeft: 8,
    },
    rowBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: 14,
        color: '#666',
        flex: 1,
        marginRight: 10,
    },
    statusContainer: {
        minWidth: 20,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    unreadBadge: {
        backgroundColor: theme.colors.primary,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
    },
    unreadText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    readStatus: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: 'bold',
    },
    separator: {
        height: 1,
        backgroundColor: '#EEEEEE',
        marginLeft: 90,
    },
});

export default styles;
