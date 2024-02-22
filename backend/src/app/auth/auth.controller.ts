import {
  InputLoginAdmin,
  InputRefreshToken,
  InputVerifyPassword,
  OutputVerifyPassword,
  type OutputLogout,
  type OutputRefreshToken,
//   VerifyGoogleInput,
//   type OutputLoginUser,
} from '@app'
import {
  Constant,
//   Constant,
//   ErrorHandler,
  logError,
  onError,
  onSuccess,
  type Option
} from '@constants'
// import { AuthMiddleware } from '@middlewares'
import { Singleton } from '@providers'
import { Request as ExpressRequest } from 'express'
import {
  Body,
  Controller,
  Example,
  Response,
//   Middlewares,
  Post,
  Request,
  Route,
//   Security,
  Tags
} from 'tsoa'
const { NETWORK_STATUS_MESSAGE } = Constant


@Tags('Auth')
@Route('auth')
export class AuthController extends Controller {

  @Post('admin/login')
  public async loginAdmin(
    @Request() req: ExpressRequest,
    @Body() body: InputLoginAdmin
  ): Promise<any> {
    try {
      const res = await Singleton.getAuthInstance().loginAdmin(body)
      return onSuccess(res)
    } catch (error: any) {
      logError(error, req)
      return onError(error, this)
    }
  }

  @Post('admin/token')
  public async refreshTokenAdmin(
    @Request() req: ExpressRequest, 
    @Body() body: InputRefreshToken
  ): Promise<Option<OutputRefreshToken>> {
    try {
      const res = await Singleton.getAuthInstance().refreshToken(body)
      return onSuccess(res)
    } catch (error: any) {
      logError(error, req)
      return onError(error, this)
    }
  }

  @Post('verify/password')
  // @Security({
  //   authorization: []
  // })
  // @Middlewares([AuthMiddleware])
  @Example<Option<OutputVerifyPassword>>({
    data: {
      authorized: true
    },
    message: 'Success',
    count: 1,
    success: true
  })
  @Response<Option<OutputVerifyPassword>>(
    '401',
    NETWORK_STATUS_MESSAGE.UNAUTHORIZED,
    {
      success: false,
      message: NETWORK_STATUS_MESSAGE.UNAUTHORIZED
    }
  )
  @Response<Option<OutputVerifyPassword>>(
    '500',
    NETWORK_STATUS_MESSAGE.INTERNAL_SERVER_ERROR,
    {
      success: false,
      message: NETWORK_STATUS_MESSAGE.INTERNAL_SERVER_ERROR
    }
  )
  public async verifyPassword(
    @Request() req: ExpressRequest,
    @Body() body: InputVerifyPassword
  ): Promise<Option<OutputVerifyPassword>> {
    try {
      const address = req.headers.address as string
      const res = await Singleton.getAuthInstance().verifyPassword(
        body,
        address
      )
      return onSuccess(res)
    } catch (error: any) {
      logError(error, req)
      return onError(error, this)
    }
  }

  @Post('logout')
//   @Middlewares([AuthMiddleware])
  public async logout(
    @Request() req: ExpressRequest
  ): Promise<Option<OutputLogout>> {
    try {
      const authorization = req.headers.authorization as string
      const res = await Singleton.getAuthInstance().logout(authorization)
      return onSuccess(res)
    } catch (error: any) {
      logError(error, req)
      return onError(error, this)
    }
  }

//   @Post('user/login/google')
//   @Security({
//     platform: []
//   })
//   public async loginGoogle(
//     @Body() payload: VerifyGoogleInput,
//     @Request() req: ExpressRequest
//   ): Promise<Option<OutputLoginUser>> {
//     try {
//       const platform = req.headers.platform as string
//       const res = await Singleton.getAuthInstance().verifyGoogle(
//         payload.google_token_id,
//         platform
//       )
//       return onSuccess(res)
//     } catch (error: any) {
//       logError(error, req)
//       return onError(error, this)
//     }
//   }

  @Post('user/token')
  public async refreshTokenUser(
    @Request() req: ExpressRequest,
    @Body() body: InputRefreshToken
  ): Promise<Option<OutputRefreshToken>> {
    return await this.refreshTokenAdmin(req, body)
  }
}