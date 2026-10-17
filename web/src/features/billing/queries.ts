import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { endTrial, getInvoicePdf, getSubscription, listInvoices, payInvoice, subscribe } from './api'

export const subscriptionQuery = queryOptions({ queryKey: ['billing', 'subscription'], queryFn: getSubscription })
export const invoicesQuery = queryOptions({ queryKey: ['billing', 'invoices'], queryFn: listInvoices })

export const useSubscription = () => useQuery(subscriptionQuery)
export const useInvoices = () => useQuery(invoicesQuery)

/** Billing changes touch both the plan and the invoices: refetch all of it. */
const useBillingMutation = <V>(mutationFn: (vars: V) => Promise<unknown>) => {
  const qc = useQueryClient()
  return useMutation({ mutationFn, onSuccess: () => qc.invalidateQueries({ queryKey: ['billing'] }) })
}

export const useEndTrial = () => useBillingMutation(endTrial)
export const useSubscribe = () => useBillingMutation(subscribe)
export const usePayInvoice = () => useBillingMutation(payInvoice)
export const useInvoicePdf = () => useMutation({ mutationFn: getInvoicePdf })
