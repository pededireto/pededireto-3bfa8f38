const claim = async (businessId: string) => {
  const { data, error } = await supabase.rpc("claim_business", { p_business_id: businessId });
  if (error) throw error;
  // show toast and redirect to business-dashboard (pending)
};
