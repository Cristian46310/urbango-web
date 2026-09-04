import { personRepository } from "@/infra/repository/person";

export const POST_LOGIN_HOME = "/app";
export const POST_LOGIN_REGISTER_PROFILE = "/app/register-profile";

/**
 * After JWT is stored: send users without a citizen profile to Mi perfil.
 */
export async function resolvePostLoginPath(): Promise<string> {
  const citizen = await personRepository.getMyProfile("citizen");
  return citizen ? POST_LOGIN_HOME : POST_LOGIN_REGISTER_PROFILE;
}
