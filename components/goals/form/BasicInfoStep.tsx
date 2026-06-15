"use client"

import { ArrowRight, DollarSign, GraduationCap, Plane, Target } from "lucide-react"
import type { UseFormReturn } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { type GoalFormValues, goalTypes } from "@/lib/goal-form"

interface BasicInfoStepProps {
  form: UseFormReturn<GoalFormValues>
  onNextStep: () => void
  selectedGoalType: string
}

export function BasicInfoStep({ form, onNextStep, selectedGoalType }: BasicInfoStepProps) {
  const handleNextStep = async () => {
    const result = await form.trigger(["title", "goal_type", "target_date"])
    if (result) onNextStep()
  }

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="goal_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">What type of goal is this?</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Select goal type" />
              </SelectTrigger>
              <SelectContent>
                {goalTypes.map((type) => {
                  const Icon =
                    type.value === "travel"
                      ? Plane
                      : type.value === "finance"
                        ? DollarSign
                        : type.value === "education"
                          ? GraduationCap
                          : Target
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">What&apos;s your goal?</FormLabel>
            <FormControl>
              <Input
                placeholder={selectedGoalType === "travel" ? "e.g., Trip to Japan" : "e.g., Learn Spanish"}
                className="h-11 text-base"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Describe your goal</FormLabel>
            <FormControl>
              <Textarea
                placeholder={
                  selectedGoalType === "travel"
                    ? "Describe your travel plans, places you want to visit..."
                    : "What do you want to achieve and why?"
                }
                className="min-h-[100px] resize-none text-base"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Start Date</FormLabel>
              <DateTimePicker
                granularity="day"
                value={field.value ?? new Date()}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="target_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Target Date</FormLabel>
              <DateTimePicker
                granularity="day"
                value={field.value ?? null}
                onChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button type="button" onClick={handleNextStep}>
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
