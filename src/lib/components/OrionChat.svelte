<script lang="ts">
  import { onMount } from 'svelte';
  let showChat = false;
  let messages: { text: string; isUser: boolean }[] = [];
  let newMessage = '';

  function toggleChat() {
    showChat = !showChat;
  }

  async function handleSubmit() {
    if (!newMessage.trim()) return;

    // Adiciona a mensagem do usuário
    messages = [...messages, { text: newMessage, isUser: true }];
    
    // Salva a mensagem para enviar ao servidor
    const userMessage = newMessage;
    // Limpa o campo de input
    newMessage = '';

    try {
      // Simula um loading state
      messages = [...messages, { text: "Pensando...", isUser: false }];

      // Faz a requisição para a API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) throw new Error('Falha na comunicação com Orion');

      const data = await response.json();
      
      // Remove a mensagem de loading e adiciona a resposta
      messages = messages.slice(0, -1);
      messages = [...messages, { text: data.response, isUser: false }];
    } catch (error) {
      // Remove a mensagem de loading e adiciona mensagem de erro
      messages = messages.slice(0, -1);
      messages = [...messages, { text: "Desculpe, ocorreu um erro na comunicação.", isUser: false }];
    }
  }
</script>

<div class="fixed bottom-4 right-4 z-50">
  <!-- Botão do chat -->
  <button
    on:click={toggleChat}
    class="bg-green-500 hover:bg-green-600 text-white rounded-full p-6 shadow-lg transition-all duration-300 transform hover:scale-105"
  >
    {#if !showChat}
      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
      </svg>
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    {/if}
  </button>

  <!-- Janela do chat -->
  {#if showChat}
    <div class="absolute bottom-28 right-0 w-96 bg-gray-900 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
      <!-- Cabeçalho -->
      <div class="bg-gray-800 p-4 border-b border-gray-700">
        <h3 class="text-white font-medium">Orion - Assistente Virtual</h3>
      </div>

      <!-- Área de mensagens -->
      <div class="h-96 overflow-y-auto p-4 space-y-4 orion-chat-messages">
        {#each messages as message}
          <div class="flex {message.isUser ? 'justify-end' : 'justify-start'}">
            <div class="{message.isUser ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-200'} rounded-lg px-4 py-2 max-w-[80%]">
              {message.text}
            </div>
          </div>
        {/each}
      </div>

      <!-- Área de input -->
      <form on:submit|preventDefault={handleSubmit} class="p-4 border-t border-gray-700">
        <div class="flex space-x-2">
          <input
            type="text"
            bind:value={newMessage}
            placeholder="Digite sua mensagem..."
            class="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>

<style>
  .orion-chat-messages {
    scrollbar-width: thin;
    scrollbar-color: rgba(34, 197, 94, 0.5) rgba(0, 0, 0, 0.2);
  }
</style> 