// Generouted, changes to this file will be overridden
/* eslint-disable */

import { components, hooks, utils } from '@generouted/react-router/client'

export type Path =
  | `/`
  | `/clients`
  | `/dashboard`
  | `/invoices`
  | `/login`
  | `/quotes`
  | `/settings/:tab?`
  | `/signup`

export type Params = {
  '/settings/:tab?': { tab?: string }
}

export type ModalPath = never

export const { Link, Navigate } = components<Path, Params>()
export const { useModals, useNavigate, useParams } = hooks<Path, Params, ModalPath>()
export const { redirect } = utils<Path, Params>()
