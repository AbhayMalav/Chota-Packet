import axios from 'axios'
import { API_BASE, ENHANCE_TIMEOUT_MS, STT_TIMEOUT_MS } from '../constants'

const client = axios.create({ baseURL: API_BASE, timeout: ENHANCE_TIMEOUT_MS })

export const health = () => client.get('/health', { timeout: 5000 })

export const enhance = (payload, openRouterKey) =>
  client.post('/enhance', payload, {
    headers: openRouterKey ? { 'X-OpenRouter-Key': openRouterKey } : {},
  })

export const stt = (audioBlob, lang = 'en') => {
  const form = new FormData()
  form.append('audio', audioBlob, 'recording.webm')
  form.append('lang', lang)
  return client.post('/stt', form, {
    timeout: STT_TIMEOUT_MS,
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const validateKey = (key) => client.post('/validate-key', { key })

export const getModels = (openRouterKey) =>
  client.get('/models', {
    headers: openRouterKey ? { 'X-OpenRouter-Key': openRouterKey } : {},
  })
