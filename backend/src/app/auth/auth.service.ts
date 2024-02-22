import type {
  InputLoginAdmin,
  InputRefreshToken,
  InputVerifyPassword,
  OutputLogout,
  OutputRefreshToken,
  OutputSubmitUser,
  OutputVerifyPassword
} from '@app'
import { Constant, ErrorHandler } from '@constants'
import { hashText, renewJWT, signJWT } from '@providers'
import { TokenDB, UserDB } from '@schemas'
import { OAuth2Client, type TokenPayload } from 'google-auth-library'

class AuthService {
  public async loginAdmin(body: InputLoginAdmin): Promise<any> {
    const isAdminExist = await UserDB.findOne({
      username: body.username,
      role: Constant.USER_ROLE.ADMIN
    })

    if (!isAdminExist) {
      throw new ErrorHandler(
        {
          username: {
            message: 'Username is not exist',
            value: body.username
          }
        },
        Constant.NETWORK_STATUS_MESSAGE.UNAUTHORIZED
      )
    }

    const hashed_password = hashText(body.password)
    const res = await UserDB.findOne({
      username: body.username,
      password: hashed_password
    })
    if (res) {
      res.last_login_at = new Date()
      await res.save()
      const jwtPayload = signJWT({
        email: res.email,
        role: res.role,
        phone: res.phone
      })
      await UserDB.findOneAndUpdate(
        { username: body.username, role: Constant.USER_ROLE.ADMIN },
        { $set: { refresh_token: hashText(jwtPayload.refresh_token) } },
        { upsert: true }
      )
      await TokenDB.findOneAndUpdate(
        { user_id: res.id },
        { $set: { token: hashText(jwtPayload.access_token) } },
        { upsert: true }
      )
      return {
        detail: res.toJSON(),
        ...jwtPayload
      }
    }
    throw new ErrorHandler(
      {
        password: {
          message: 'Password is incorrect',
          value: body.password
        }
      },
      Constant.NETWORK_STATUS_MESSAGE.UNAUTHORIZED
    )
  }

  async refreshToken(body: InputRefreshToken): Promise<OutputRefreshToken> {
    try {
      const { access_token, payload } = renewJWT(body.refresh_token)
      const userRes = await UserDB.findOne({
        email: payload.email
      })
      if (!userRes) {
        throw new Error(Constant.NETWORK_STATUS_MESSAGE.UNAUTHORIZED)
      }
      await TokenDB.findOneAndUpdate(
        { user_id: userRes.id },
        { token: hashText(access_token) },
        { upsert: true, new: true }
      )
      return {
        access_token
      }
    } catch (error) {
      throw new Error(Constant.NETWORK_STATUS_MESSAGE.UNAUTHORIZED)
    }
  }

  async verifyPassword(
    body: InputVerifyPassword,
    email: string
  ): Promise<OutputVerifyPassword> {
    const userRes = await UserDB.findOne({
      where: {
        email,
        password: hashText(body.password)
      }
    })
    return {
      authorized: !!userRes
    }
  }

  async logout(access_token: string): Promise<OutputLogout> {
    await TokenDB.deleteOne({ token: hashText(access_token) })
    return { logout: true }
  }

  async verifyGoogle(
    google_token_id: string,
  ): Promise<OutputSubmitUser> {
    const client = new OAuth2Client()
    const ticket = await client.verifyIdToken({
      idToken: google_token_id,
    })
    const payload = ticket.getPayload() as TokenPayload
    const { sub } = payload
    if (!sub) {
      throw new Error(Constant.NETWORK_STATUS_MESSAGE.NOT_FOUND)
    }
    /**
     * Finds a user in the database with the given username.
     * The object will have all attributes except for those specified in this.excludeAdminUserData.
     */
    const res = await UserDB.findOneAndUpdate(
      { username: sub },
      { $setOnInsert: { username: sub } },
      { upsert: true, new: true }
    )
    /**
     * Updates the last login time for a user and saves the changes to the database.
     */
    res.last_login_at = new Date()
    await res.save()
    /**
     * Generates a JSON Web Token (JWT) with the given user information and secret key.
     */
    const jwtPayload = signJWT({
      email: res.email,
      role: res.role,
      phone: res.phone
    })
    await TokenDB.findOneAndUpdate(
      {
        user_id: res.id
      },
      { $set: { token: hashText(jwtPayload.access_token) } },
      { upsert: true }
    )
    return {
      detail: res.toJSON(),
      ...jwtPayload
    }
  }

  async verifysGoogle(): Promise<any> {
    const client = new OAuth2Client(Constant.GOOGLE_ID);
    const url = client.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/userinfo.email'
    });

    console.log('Please visit the following URL for Google auth:');
    console.log(url);
  }
}

export { AuthService }
