import { randomBytes, createHash } from 'node:crypto'
import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import User from '#models/user'
import EmailVerificationToken from '#models/email_verification_token'

const TOKEN_EXPIRY_HOURS = 24

export default class EmailVerificationService {
  private generateToken(): { rawToken: string; tokenHash: string } {
    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')
    return { rawToken, tokenHash }
  }

  async createToken(user: User): Promise<string> {
    await EmailVerificationToken.query().where('user_id', user.id).delete()

    const { rawToken, tokenHash } = this.generateToken()

    await EmailVerificationToken.create({
      userId: user.id,
      tokenHash,
      expiresAt: DateTime.now().plus({ hours: TOKEN_EXPIRY_HOURS }),
    })

    return rawToken
  }

  async sendVerificationEmail(user: User, rawToken: string): Promise<void> {
    const frontendUrl = env.get('FRONTEND_URL')
    const verificationUrl = `${frontendUrl}/verify-email?token=${rawToken}`

    await mail.send((message) => {
      message
        .to(user.email)
        .from('noreply@kcal.app')
        .subject('Vérifiez votre adresse email')
        .html(
          `<h1>Bienvenue sur Kcal, ${user.username} !</h1>
          <p>Veuillez vérifier votre adresse email en cliquant sur le lien ci-dessous :</p>
          <p><a href="${verificationUrl}">Confirmer mon compte</a></p>
          <p>Ce lien expirera dans ${TOKEN_EXPIRY_HOURS} heures.</p>
          <p>Si vous n'avez pas créé de compte, veuillez ignorer cet email.</p>`
        )
    })
  }

  async verifyToken(rawToken: string): Promise<User> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')

    const verificationToken = await EmailVerificationToken.query()
      .where('token_hash', tokenHash)
      .preload('user')
      .first()

    if (!verificationToken) {
      throw new Error('INVALID_TOKEN')
    }

    if (verificationToken.isExpired) {
      await verificationToken.delete()
      throw new Error('TOKEN_EXPIRED')
    }

    const user = verificationToken.user
    user.isEmailVerified = true
    await user.save()

    await verificationToken.delete()

    return user
  }
}
