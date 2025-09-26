import AuthController from "./auth";
import BrandKitController from "./brandKit";
import BrandProfileController from "./brandProfile";
import { CampaignPlanController } from "./campaign";
import { VisitedUserController } from "./visited";

export default  {
  auth: AuthController,
  branhdProfile: BrandProfileController,
  brandKit: BrandKitController,
  visitedUser: VisitedUserController,
  campainPlan:CampaignPlanController
}


// https://accounts.google.com/o/oauth2/v2/auth?client_id=573404714887-0nuo07j9gvc172fj88u5274gojco4non.apps.googleusercontent.com&redirect_uri=https://becoming-currently-serval.ngrok-free.app/api/auth/google-login&response_type=code&scope=openid%20email%20profile
