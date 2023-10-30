import { withFormik, FormikProps, FormikErrors, Form, Field } from "formik";

interface loginValidation {
  email: string;
  password: string;
}

interface registerValidation {
  nickname: string;
  email: string;
  password: string;
  cpassword: string;
}

export const signInValidate = (values: loginValidation) => {
  let errors: FormikErrors<loginValidation> = {};

  if (!values.email) {
    errors.email = "Required";
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
    errors.email = "Invalid email address";
  }

  if (!values.password) {
    errors.password = "Required";
  } else if (values.password.length < 8 || values.password.length > 20) {
    errors.password =
      "Must be greater thatn 8 and less than 20 characters long";
  } else if (values.password.includes(" ")) {
    errors.password = "Invalid password";
  }
  return errors;
};

export const signUpValidate = (values: registerValidation) => {
  let errors: FormikErrors<registerValidation> = {};

  if (!values.nickname) {
    errors.nickname = "Required";
  } else if (values.nickname.includes(" ")) {
    errors.nickname = "Invalid nickname";
  }

  if (!values.email) {
    errors.email = "Required";
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
    errors.email = "Invalid email address";
  }

  if (!values.password) {
    errors.password = "Required";
  } else if (values.password.length < 8 || values.password.length > 20) {
    errors.password =
      "Must be greater thatn 8 and less than 20 characters long";
  } else if (values.password.includes(" ")) {
    errors.password = "Invalid password";
  }

  if (!values.cpassword) {
    errors.cpassword = "Required";
  } else if (values.password !== values.cpassword) {
    errors.cpassword = "Password not match";
  } else if (values.password.includes(" ")) {
    errors.cpassword = "Invalid confirm password";
  }
  return errors;
};
