import { BaseService } from "../BaseService";

export class LeaderService extends BaseService {
  static async fetchLeaders(tenantId: string) {
    return this.getClient()
      .from("contacts_decrypted")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_leader", true)
      .is("deleted_at", null)
      .order("name");
  }

  static async fetchVoterCounts(leaderIds: string[]) {
    return this.getClient()
      .from("contacts_decrypted")
      .select("leader_id")
      .in("leader_id", leaderIds)
      .is("deleted_at", null);
  }

  static async fetchVoters(leaderId: string) {
    return this.getClient()
      .from("contacts_decrypted")
      .select("id, name, phone, city, engagement")
      .eq("leader_id", leaderId)
      .is("deleted_at", null)
      .order("name");
  }

  static async deleteLeader(contactId: string) {
    const client = this.getClient();
    const { error: contactError } = await client
      .from("contacts")
      .update({ deleted_at: new Date().toISOString(), is_leader: false })
      .eq("id", contactId);
    
    if (contactError) return { error: contactError };

    return client
      .from("leaders")
      .delete()
      .eq("contact_id", contactId);
  }
}
