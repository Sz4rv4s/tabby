import iconv from 'iconv-lite'

export const DEFAULT_SSH_ENCODING = 'utf-8'

export function resolveSSHEncoding (encoding: unknown): string {
    if (typeof encoding !== 'string' || !encoding.trim()) {
        return DEFAULT_SSH_ENCODING
    }

    const name = encoding.trim()
    // This is the name reported by some POSIX locales for US-ASCII.
    const resolved = name.toUpperCase() === 'ANSI_X3.4-1968' ? 'ascii' : name
    if (!iconv.encodingExists(resolved)) {
        throw new Error(`Unsupported SSH character encoding: ${name}`)
    }
    return resolved
}

export class SSHEncodingCodec {
    private decoder: ReturnType<typeof iconv.getDecoder>
    private encoder: ReturnType<typeof iconv.getEncoder>

    constructor (encoding: string) {
        this.decoder = iconv.getDecoder(encoding)
        this.encoder = iconv.getEncoder(encoding)
    }

    decode (data: Buffer): Buffer {
        return Buffer.from(this.decoder.write(data), 'utf-8')
    }

    encode (data: Buffer): Buffer {
        return this.encoder.write(data.toString('utf-8'))
    }

    flush (): Buffer {
        return Buffer.from(this.decoder.end() ?? '', 'utf-8')
    }
}
