// lib/firebase/npcChat.ts
import { realtimeDb } from './config'; // Assuming config has realtimeDb export
import { ref, push } from 'firebase/database';
import { characters } from '../../data/characters';
import { generateAvatarUrl } from '@/lib/utils/avatarGenerator';
import { CrewChatMessage } from '@/lib/types/blackout'; // Re-using existing message type

/**
 * Sends a chat message from an NPC to a specific crew's chat.
 * @param characterId The ID of the NPC sending the message.
 * @param crewId The ID of the crew chat to send the message to.
 * @param messageText The content of the message.
 * @param delayMs Optional delay before sending the message (e.g., to simulate typing).
 */
export const sendNpcChatMessage = async (
  characterId: string,
  crewId: 'BQC' | 'SPS' | 'LZT' | 'DGC',
  messageText: string,
  delayMs: number = 0
): Promise<void> => {
  const npc = characters.find(c => c.id === characterId);

  if (!npc) {
    console.error(`NPC with ID "${characterId}" not found. Cannot send message.`);
    return;
  }

  // Generate avatar URL for the NPC
  const avatarUrl = generateAvatarUrl(
    npc.id,
    npc.name,
    npc.gender,
    60, // Default size for chat avatars
    npc.avatarBackgroundColor
  );

  const messageData: CrewChatMessage = {
    id: Date.now().toString() + Math.random().toString(36).substring(7), // Unique ID for the message
    text: messageText,
    senderUid: `npc_${npc.id}`, // Unique identifier for the NPC user
    senderName: npc.name,
    avatar: avatarUrl,
    timestamp: Date.now(),
  };

  const messagesRef = ref(realtimeDb, `crew-chat/${crewId}`);

  await new Promise(resolve => setTimeout(resolve, delayMs)); // Apply delay if specified

  console.log(`[sendNpcChatMessage] Preparing to push message for NPC: ${npc.name}, Crew: ${crewId}`);
  console.log(`[sendNpcChatMessage] Message data:`, messageData);

  try {
    const pushResult = await push(messagesRef, messageData);
    console.log(`[sendNpcChatMessage] ✅ Message pushed successfully. Key: ${pushResult.key}`);
    console.log(`NPC "${npc.name}" sent message to ${crewId} chat: "${messageText}"`);
  } catch (error) {
    console.error(`[sendNpcChatMessage] ❌ Error pushing message from "${npc.name}" to ${crewId}:`, error);
  }
};
