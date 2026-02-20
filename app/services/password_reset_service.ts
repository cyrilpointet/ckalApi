import { randomBytes, createHash } from 'node:crypto'
import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import User from '#models/user'
import PasswordResetToken from '#models/password_reset_token'

const TOKEN_EXPIRY_HOURS = 1

export default class PasswordResetService {
  private generateToken(): { rawToken: string; tokenHash: string } {
    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')
    return { rawToken, tokenHash }
  }

  async createToken(user: User): Promise<string> {
    await PasswordResetToken.query().where('user_id', user.id).delete()

    const { rawToken, tokenHash } = this.generateToken()

    await PasswordResetToken.create({
      userId: user.id,
      tokenHash,
      expiresAt: DateTime.now().plus({ hours: TOKEN_EXPIRY_HOURS }),
    })

    return rawToken
  }

  async sendResetEmail(user: User, rawToken: string): Promise<void> {
    const frontendUrl = env.get('FRONTEND_URL')
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`

    await mail.send((message) => {
      message
        .to(user.email)
        .from('noreply@cookmatch.app')
        .subject('CookMatch - Réinitialisation de votre mot de passe')
        .html(
          `<h1>Réinitialisation de mot de passe</h1>
          <p>Bonjour ${user.username},</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous :</p>
          <p><a href="${resetUrl}">Réinitialiser mon mot de passe</a></p>
          <p>Ce lien expirera dans ${TOKEN_EXPIRY_HOURS} heure(s).</p>
          <p>Si vous n'avez pas fait cette demande, veuillez ignorer cet email.</p>`
        )
    })
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<User> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')

    const resetToken = await PasswordResetToken.query()
      .where('token_hash', tokenHash)
      .preload('user')
      .first()

    if (!resetToken) {
      throw new Error('INVALID_TOKEN')
    }

    if (resetToken.isExpired) {
      await resetToken.delete()
      throw new Error('TOKEN_EXPIRED')
    }

    const user = resetToken.user
    user.password = newPassword
    await user.save()

    await resetToken.delete()

    return user
  }
}
