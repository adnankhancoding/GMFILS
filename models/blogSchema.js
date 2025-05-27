import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    othertitle: {
      type: String,
      required: [true, 'Other Title is required'],
      trim: true,
    },
    excert: {
      type: String,
      required: [true, 'Excert is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    otherdetails: {
      type: String,
      default: '',
    },
    author: {
      type: String,
      required: true,
    },
    images: {
        type: [String],
        default: []
    },
    video: {
      type: String, // URL to the video
      default: '',
    },
    
    category: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category', 
      required: true 
    },

    published: {
      type: "string",
      trim: true,
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

export const Blog = mongoose.model('Blog', blogSchema);

