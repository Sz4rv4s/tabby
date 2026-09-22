import { SessionMiddleware } from 'tabby-terminal'
import { SSHEncodingCodec } from './encodingCodec'

/** Converts shell text at the SSH boundary, leaving the terminal in UTF-8. */
export class SSHEncodingMiddleware extends SessionMiddleware {
    private codec: SSHEncodingCodec

    constructor (encoding: string) {
        super()
        this.codec = new SSHEncodingCodec(encoding)
    }

    feedFromSession (data: Buffer): void {
        const decoded = this.codec.decode(data)
        if (decoded.length) {
            super.feedFromSession(decoded)
        }
    }

    feedFromTerminal (data: Buffer): void {
        super.feedFromTerminal(this.codec.encode(data))
    }

    close (): void {
        const remainder = this.codec.flush()
        if (remainder.length) {
            super.feedFromSession(remainder)
        }
        super.close()
    }
}
