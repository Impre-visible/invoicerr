// Generouted, changes to this file will be overridden
/* eslint-disable */

import { components, hooks, utils } from '@generouted/react-router/client'

export type Path =
  | `/`
  | `/articles`
  | `/auth/sign-in`
  | `/auth/sign-out`
  | `/auth/sign-up`
  | `/clients`
  | `/dashboard`
  | `/documents`
  | `/documents/:typeId`
  | `/settings/:tab?`
  | `/signature/:token`
  | `/statistics`

export type Params = {
  '/documents/:typeId': { typeId: string }
  '/settings/:tab?': { tab?: string }
  '/signature/:token': { token: string }
}

export type ModalPath = never

export const { Link, Navigate } = components<Path, Params>()
export const { useModals, useNavigate, useParams } = hooks<Path, Params, ModalPath>()
export const { redirect } = utils<Path, Params>()
