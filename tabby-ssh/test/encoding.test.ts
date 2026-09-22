import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_SSH_ENCODING, resolveSSHEncoding, SSHEncodingCodec } from '../src/session/encodingCodec.ts'

describe('SSH character encoding', () => {
    it('keeps existing profiles on UTF-8 and accepts the POSIX ASCII name', () => {
        assert.equal(resolveSSHEncoding(undefined), DEFAULT_SSH_ENCODING)
        assert.equal(resolveSSHEncoding('  '), DEFAULT_SSH_ENCODING)
        assert.equal(resolveSSHEncoding(' ANSI_X3.4-1968 '), 'ascii')
        assert.equal(resolveSSHEncoding('ISO-8859-1'), 'ISO-8859-1')
        assert.throws(() => resolveSSHEncoding('not-an-encoding'), /Unsupported SSH character encoding/)
    })

    it('converts both directions for a legacy single-byte encoding', () => {
        const codec = new SSHEncodingCodec(resolveSSHEncoding('ISO-8859-1'))
        assert.equal(codec.decode(Buffer.from([0x63, 0x61, 0x66, 0xe9])).toString(), 'café')
        assert.deepEqual(codec.encode(Buffer.from('café')), Buffer.from([0x63, 0x61, 0x66, 0xe9]))
    })

    it('preserves characters split across remote output chunks', () => {
        const codec = new SSHEncodingCodec(resolveSSHEncoding('shift_jis'))
        assert.equal(codec.decode(Buffer.from([0x82])).length, 0)
        assert.equal(codec.decode(Buffer.from([0xa0])).toString(), 'あ')
        assert.equal(codec.flush().length, 0)
    })

    it('converts the terminal escape bytes unchanged for ASCII', () => {
        const codec = new SSHEncodingCodec(resolveSSHEncoding('ANSI_X3.4-1968'))
        const bytes = Buffer.from('\x1b[31mhello\x1b[0m')
        assert.deepEqual(codec.decode(bytes), bytes)
        assert.deepEqual(codec.encode(bytes), bytes)
    })
})
