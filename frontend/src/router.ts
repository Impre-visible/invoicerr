// Generouted, changes to this file will be overridden
/* eslint-disable */

import { components, hooks, utils } from '@generouted/react-router/client'

export type Path =
  | `/`
  | `/clients`
  | `/dashboard`
  | `/invoices`
  | `/login`
  | `/logout`
  | `/quotes`
  | `/receipts`
  | `/settings/:tab?`
  | `/signature/:id`
  | `/signup`

export type Params = {
  '/settings/:tab?': { tab?: string }
  '/signature/:id': { id: string }
}

export type ModalPath = never

export const { Link, Navigate } = components<Path, Params>()
export const { useModals, useNavigate, useParams } = hooks<Path, Params, ModalPath>()
export const { redirect } = utils<Path, Params>()
