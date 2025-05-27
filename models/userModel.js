// This file re-exports the User model from userSchema.js
// This helps maintain backward compatibility if some files are importing from userModel.js

import { User } from "./userSchema.js";

export default User;