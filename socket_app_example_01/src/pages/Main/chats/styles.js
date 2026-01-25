import { StyleSheet } from "react-native";
import theme from "../../../utils/colors";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: -15,
    },
    headerAvatar: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        marginRight: 10,
        backgroundColor: '#ccc',
    },
    headerName: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
    },
    listContent: {
        paddingHorizontal: 15,
        paddingVertical: 20,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 20,
        marginBottom: 10,
        elevation: 1,
    },
    myBubble: {
        alignSelf: 'flex-end',
        backgroundColor: theme.colors.primary,
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.card,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#eee',
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    myText: {
        color: '#fff',
    },
    theirText: {
        color: theme.colors.text,
    },
    timestamp: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myTimestamp: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    theirTimestamp: {
        color: '#999',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        paddingHorizontal: 15,
        backgroundColor: theme.colors.card,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    input: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        fontSize: 16,
        maxHeight: 100,
        color: theme.colors.text,
    },
    sendButton: {
        marginLeft: 10,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    typingIndicator: {
        fontSize: 12,
        color: theme.colors.primary,
        fontStyle: 'italic',
        marginTop: 2,
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 2,
    },
    readStatus: {
        fontSize: 12,
        marginLeft: 4,
        color: 'rgba(255, 255, 255, 0.9)',
    },
});

export default styles;