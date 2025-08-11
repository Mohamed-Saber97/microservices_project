const mongoose = require("mongoose");
const argon2 = require("argon2");
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

//Defines a pre hook for the model.
userSchema.pre("save", async function (next) {
  /**
     * 
     * This sets up a pre-save middleware on a Mongoose schema called userSchema.

        It means the function inside will run before a document (a user) is saved to the database.

        next is a callback that must be called to continue the save operation.
     */
  if (this.isModified("password")) {
    /**
         * This checks if the password field was modified (e.g., created or updated).

         * this refers to the current document (user instance).

         * This is important because you only want to hash the password if it has changed—not on every save.
        */
    /**
     * Returns true if any of the given paths are modified, else false.
     * If no arguments, returns true if any path in this document is modified.
     */

    try {
      this.password = await argon2.hash(this.password);
    } catch (error) {
      return next(error);
      /**
       * If an error occurs during hashing, it's passed to the next() function to handle it (e.g., via error middleware).

            This prevents saving the user if hashing fails.
       */
    }
  }

  /**
   * This middleware ensures that whenever a user’s password is created or changed,
   * it gets hashed using Argon2 before being saved to the database—providing secure storage of passwords.
   */
});


//reafctor the function

/*
userSchema.pre('save', async function(next) {
    try {
        if(this.isModified('password')){
            this.password = await argon2.hash('password');
        }
        next();
    } catch (error) {
        next(error);
    }
});


*/


//verfiy password

userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
            return await argon2.verify(this.password, candidatePassword);
    } catch (error) {
        throw error;
    }
}
//A text index allows you to perform efficient full-text search queries on string content within a field
//Without a text index, MongoDB can't perform full-text search efficiently. 
//With it, queries using $text and $search become fast and optimized.
userSchema.index({username: 'text'});

const User = mongoose.model('User', userSchema);

module.exports = User;

