// // src/controllers/profile.controller.ts
// import { Request, Response, NextFunction } from "express";
// import { User } from "../models/user";
// import { ErrorResponse } from "../utils/error-response";

// // @desc   Complete user onboarding step 1
// // @route  PUT /api/v1/profile/onboarding/step1
// // @access Private
// export const completeOnboardingStep1 = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const { fullName, role, experience, about } = req.body;

//     // Update user profile
//     if (!req.user) {
//       req.user?.id as string,
//     }

//     if (!req.user || !req.user.id) {
//       return next(new ErrorResponse("User not authenticated", 401));
//     }
//     const user = await User.findByIdAndUpdate(
//       req.user.id,
//       {
//         fullName,
//         role,
//         experience,
//         about,
//       },
//       {
//         new: true,
//         runValidators: true,
//       }
//     );

//     if (!user) {
//       return next(new ErrorResponse("User not found", 404));
//     }

//     res.status(200).json({
//       success: true,
//       data: user,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc   Complete user onboarding step 2
// // @route  PUT /api/v1/profile/onboarding/step2
// // @access Private
// export const completeOnboardingStep2 = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const { skills } = req.body;

//     // Update user skills
//     const user = await User.findByIdAndUpdate(
//       req.user.id,
//       {
//         skills,
//       },
//       {
//         new: true,
//         runValidators: true,
//       }
//     );

//     if (!user) {
//       return next(new ErrorResponse("User not found", 404));
//     }

//     res.status(200).json({
//       success: true,
//       data: user,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc   Get user profile
// // @route  GET /api/v1/profile
// // @access Private
// export const getProfile = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const user = await User.findById(req.user.id);

//     if (!user) {
//       return next(new ErrorResponse("User not found", 404));
//     }

//     res.status(200).json({
//       success: true,
//       data: user,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc   Update user profile
// // @route  PUT /api/v1/profile
// // @access Private
// export const updateProfile = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     // Only allow updating specific fields
//     const fieldsToUpdate = {
//       fullName: req.body.fullName,
//       about: req.body.about,
//       experience: req.body.experience,
//       skills: req.body.skills,
//     };

//     // Remove undefined fields
//     Object.keys(fieldsToUpdate).forEach(
//       (key) => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
//     );

//     const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
//       new: true,
//       runValidators: true,
//     });

//     if (!user) {
//       return next(new ErrorResponse("User not found", 404));
//     }

//     res.status(200).json({
//       success: true,
//       data: user,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
