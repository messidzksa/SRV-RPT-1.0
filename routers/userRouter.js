const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authcontroller");
const authorizeRoles = require("../middleware/rolebased");

const router = express.Router();

/* --------------------------- Public Auth Routes -------------------------- */
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.post("/signup", authController.signup);

/* --------------------------- Protected Routes ---------------------------- */
router.use(authController.protect); // Protect all routes after this middleware

router.get("/me", userController.getMe, userController.getUser);

/* ----------------------- Password Update (Admin only) -------------------- */
router.patch(
  "/updateMyPassword",
  authController.protect,
  authorizeRoles("VXR"), // Only admin can do this
  authController.updatePassword
);

/* ---------------------------- Admin-Only Routes -------------------------- */
router.use(authorizeRoles("VXR")); // Super admin or root only

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
