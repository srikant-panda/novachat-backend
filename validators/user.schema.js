import { z } from "zod";

export const signupSchema = z
  .object({
    name: z.string().trim().min(3, "Minimum lenghth of name should be 3"),
    age: z
      .number()
      .min(10, "Minimum age should be 10")
      .max(100, "Maximum age should be 100")
      .optional(),
    email: z.preprocess((value) => {
      return typeof value == "string" ? value.trim().toLowerCase() : "";
    }, z.string().email("Email must be valid.")),
    password: z
      .string()
      .min(8)
      .max(30)
      .regex(/[A-Z]/, "Password should have atleast one Capital character")
      .regex(/[a-z]/, "Password should have atleast one lowercase character")
      .regex(/[0-9]/, "Passowrd should have atleast one number")
      .regex(
        /[~!@#$%^&*().,<>_+]/,
        "Password should have atleaast one special character.",
      ),
  })
  .strict();

export const signinSchema = z
  .object({
    email: z.preprocess((value) => {
      return typeof value == "string" ? value.trim().toLowerCase() : "";
    }, z.email("Email must be valid.")),
    password: z
      .string()
      .min(8)
      .max(30)
      .regex(/[A-Z]/, "Password should have atleast one Capital character")
      .regex(/[a-z]/, "Password should have atleast one lowercase character")
      .regex(/[0-9]/, "Passowrd should have atleast one number")
      .regex(
        /[~!@#$%^&*().,<>_+]/,
        "Password should have atleaast one special character.",
      ),
  })
  .strict();
