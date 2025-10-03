import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, X } from 'lucide-react';

const addStudentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  grade: z.enum(['3rd', '4th', '5th', '6th', '7th'], {
    required_error: 'Please select a grade',
  }),
});

type AddStudentForm = z.infer<typeof addStudentSchema>;

interface AddStudentFormProps {
  onSubmit: (data: AddStudentForm) => void;
  onCancel: () => void;
  isPending?: boolean;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
}

export default function AddStudentForm({
  onSubmit,
  onCancel,
  isPending = false,
  parentName,
  parentEmail,
  parentPhone
}: AddStudentFormProps) {
  const form = useForm<AddStudentForm>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: {
      name: '',
      grade: undefined,
    },
  });

  const handleSubmit = (data: AddStudentForm) => {
    // Include parent info when submitting
    onSubmit({
      ...data,
      parentName,
      parentEmail,
      parentPhone,
    } as any);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add Student
            </CardTitle>
            <CardDescription>
              Add a new student to your account
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            data-testid="button-cancel-add-student"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter student's full name"
                      {...field}
                      data-testid="input-student-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-student-grade">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="3rd" data-testid="option-grade-3">3rd Grade</SelectItem>
                      <SelectItem value="4th" data-testid="option-grade-4">4th Grade</SelectItem>
                      <SelectItem value="5th" data-testid="option-grade-5">5th Grade</SelectItem>
                      <SelectItem value="6th" data-testid="option-grade-6">6th Grade</SelectItem>
                      <SelectItem value="7th" data-testid="option-grade-7">7th Grade</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isPending}
                className="flex-1"
                data-testid="button-cancel-student"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1"
                data-testid="button-submit-student"
              >
                {isPending ? 'Adding...' : 'Add Student'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
