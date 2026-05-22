import { Document } from 'mongoose';

export interface ISocialLinks {
    linkedin?: string;
    twitter?: string;
    github?: string;
}

export interface IOurTeam extends Document {
    name: string;
    img: string;
    url?: string;
    position: string;
    bio?: string;
    socialLinks?: ISocialLinks;
}
