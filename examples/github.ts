/*
 * @poppinss/oauth-client
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Request, Response } from 'express'

import { githubConfig } from './config'
import { Oauth2Client } from '../src/Clients/Oauth2'

export function renderRedirect(_: Request, res: Response) {
  /**
   * Instantiate the driver
   */
  const driver = new Oauth2Client(githubConfig)

  /**
   * Get the state to avoid CSRF
   */
  const state = driver.getState()

  /**
   * Make the redirect URL. We also send the state in the URL query string,
   * along with a github specific "allow_signup" option.
   */
  const redirectUrl = driver.getRedirectUrl((request) => {
    request.param('state', state)
    request.param('allow_signup', true)
  })

  /**
   * Store state inside cookie for later verification
   */
  res.cookie('gh_oauth_state', state, { sameSite: false })
  res.type('html').send(`<a href="${redirectUrl}">Login with Github</a>`)
}

export async function handleCallback(req: Request, res: Response) {
  if (!req.query.code) {
    res.status(400).send('Missing authorization code')
    return
  }

  /**
   * Instantiate the driver
   */
  const driver = new Oauth2Client(githubConfig)
  try {
    driver.verifyState(req.cookies.gh_oauth_state, req.query.state as string)
    const accessToken = await driver.getAccessToken((request) => {
      request.param('code', req.query.code)
      request.param('state', req.query.state)
    })
    res.type('json').send(accessToken)
  } catch (error) {
    res.send(error.response && error.response.body ? error.response.body : error.response || error)
  }
}
