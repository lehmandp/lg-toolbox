import 'server-only'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

function secret(): Buffer {
  const value = process.env.TOOLBOX_AI_ENCRYPTION_KEY
  if (!value || !/^[a-fA-F0-9]{64}$/.test(value)) throw new Error('TOOLBOX_AI_ENCRYPTION_KEY must be 32 bytes encoded as 64 hex characters')
  return Buffer.from(value, 'hex')
}
export function encryptKey(value: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', secret(), iv)
  const encrypted = Buffer.concat([cipher.update(value,'utf8'),cipher.final()])
  return [iv.toString('base64'),cipher.getAuthTag().toString('base64'),encrypted.toString('base64')].join('.')
}
export function decryptKey(value: string): string {
  const [a,b,c] = value.split('.')
  if (!a||!b||!c) throw new Error('Invalid encrypted key')
  const decipher = createDecipheriv('aes-256-gcm',secret(),Buffer.from(a,'base64'))
  decipher.setAuthTag(Buffer.from(b,'base64'))
  return Buffer.concat([decipher.update(Buffer.from(c,'base64')),decipher.final()]).toString('utf8')
}
