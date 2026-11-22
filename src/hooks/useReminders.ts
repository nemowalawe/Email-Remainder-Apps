import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reminderApi, SearchParams, CreateReminderInput } from '../lib/api';
import toast from 'react-hot-toast';

export function useReminders(params: SearchParams = {}) {
  return useQuery({
    queryKey: ['reminders', params],
    queryFn: () => reminderApi.list(params),
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReminderInput) => reminderApi.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success(result.message);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membuat reminder');
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reminderApi.delete(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success(result.message);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menghapus reminder');
    },
  });
}
