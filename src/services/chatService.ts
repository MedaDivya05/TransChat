import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Chat, Message, User } from '../types';

export const createOrGetChat = async (currentUserId: string, otherUserId: string): Promise<string> => {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', currentUserId)
  );

  const querySnapshot = await getDocs(q);
  let existingChat: string | null = null;

  querySnapshot.forEach((doc) => {
    const chatData = doc.data();
    if (chatData.participants.includes(otherUserId)) {
      existingChat = doc.id;
    }
  });

  if (existingChat) {
    return existingChat;
  }

  const newChatRef = doc(collection(db, 'chats'));
  await setDoc(newChatRef, {
    participants: [currentUserId, otherUserId],
    lastMessage: '',
    lastMessageTime: Timestamp.now(),
    translationSettings: {
      [currentUserId]: {
        enabled: false,
        targetLanguage: 'en',
      },
      [otherUserId]: {
        enabled: false,
        targetLanguage: 'en',
      },
    },
  });

  return newChatRef.id;
};

export const getUserChats = (userId: string, callback: (chats: Chat[]) => void) => {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTime', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const chats: Chat[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      chats.push({
        id: doc.id,
        participants: data.participants,
        lastMessage: data.lastMessage,
        lastMessageTime: data.lastMessageTime.toDate(),
        translationSettings: data.translationSettings || {},
      });
    });
    callback(chats);
  });
};

export const getChatMessages = (chatId: string, callback: (messages: Message[]) => void) => {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('chatId', '==', chatId),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        chatId: data.chatId,
        senderId: data.senderId,
        receiverId: data.receiverId,
        originalText: data.originalText,
        translatedText: data.translatedText,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
        fileName: data.fileName,
        fileSize: data.fileSize,
        timestamp: data.timestamp.toDate(),
        deletedForEveryone: data.deletedForEveryone || false,
        deletedAt: data.deletedAt ? data.deletedAt.toDate() : undefined,
        replyTo: data.replyTo || undefined,
      });
    });
    callback(messages);
  });
};

export const sendMessage = async (
  chatId: string,
  senderId: string,
  receiverId: string,
  text?: string,
  mediaUrl?: string,
  mediaType?: 'image' | 'video' | 'file',
  fileName?: string,
  fileSize?: number,
  replyToId?: string,
  replyToSenderName?: string,
  replyToText?: string
): Promise<void> => {
  const messagesRef = collection(db, 'messages');
  await addDoc(messagesRef, {
    chatId,
    senderId,
    receiverId,
    originalText: text || '',
    translatedText: '',
    mediaUrl: mediaUrl || '',
    mediaType: mediaType || '',
    fileName: fileName || '',
    fileSize: fileSize || 0,
    timestamp: Timestamp.now(),
    replyTo: replyToId ? {
      messageId: replyToId,
      senderName: replyToSenderName || '',
      text: replyToText || '',
    } : null,
  });

  let lastMessage = text;
  if (!lastMessage) {
    if (mediaType === 'image') {
      lastMessage = '📷 Photo';
    } else if (mediaType === 'video') {
      lastMessage = '🎥 Video';
    } else if (mediaType === 'file') {
      lastMessage = `📎 ${fileName}`;
    }
  }

  const chatRef = doc(db, 'chats', chatId);
  await setDoc(
    chatRef,
    {
      lastMessage: lastMessage || 'Message',
      lastMessageTime: Timestamp.now(),
    },
    { merge: true }
  );
};

export const updateTranslationSettings = async (
  chatId: string,
  userId: string,
  enabled: boolean,
  targetLanguage: string
): Promise<void> => {
  const chatRef = doc(db, 'chats', chatId);
  await setDoc(
    chatRef,
    {
      translationSettings: {
        [userId]: {
          enabled,
          targetLanguage,
        },
      },
    },
    { merge: true }
  );
};

export const getAllUsers = async (): Promise<User[]> => {
  const usersRef = collection(db, 'users');
  const querySnapshot = await getDocs(usersRef);
  const users: User[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    users.push({
      uid: doc.id,
      email: data.email,
      displayName: data.displayName,
      createdAt: new Date(data.createdAt),
    });
  });

  return users;
};

export const getUser = async (userId: string): Promise<User | null> => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) return null;

  const data = userDoc.data();
  return {
    uid: userDoc.id,
    email: data.email,
    displayName: data.displayName,
    createdAt: new Date(data.createdAt),
  };
};

export const deleteMessageForEveryone = async (messageId: string): Promise<void> => {
  const messageRef = doc(db, 'messages', messageId);
  await setDoc(
    messageRef,
    {
      deletedForEveryone: true,
      deletedAt: Timestamp.now(),
    },
    { merge: true }
  );
};
